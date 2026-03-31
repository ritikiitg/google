import { GoogleGenAI } from '@google/genai';
import { AppError } from '../middleware/error.middleware.js';

// Initialize Gemini client
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY not set - AI features will not work');
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Model fallback chain: 3-pro → 3-flash → 2.5-flash (no legacy models)
const MODEL_FALLBACK_CHAIN = [
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-flash'
];

export interface UserProfile {
    riskTolerance: 'low' | 'medium' | 'high';
    priorities: string[];
    currentSituation?: string;
}

export interface TimelineMetric {
    score: number;
    trend: 'up' | 'stable' | 'down';
}

export interface TimelineEvent {
    period: string;
    description: string;
    impact: 'positive' | 'neutral' | 'negative';
}

export interface GeneratedTimeline {
    title: string;
    summary: string;
    probability: number;
    metrics: {
        emotional: TimelineMetric;
        financial: TimelineMetric;
        career: TimelineMetric;
        relationships: TimelineMetric;
        risk: TimelineMetric;
    };
    events: TimelineEvent[];
    tradeoffs: string[];
    secondOrderEffects: string[];
}

export interface TimelineGenerationResult {
    timelines: GeneratedTimeline[];
}
// coded by ritik raj

const SYSTEM_PROMPT = `You are an AI life simulation engine specialized in generating realistic future timelines based on life decisions. Your role is to:

1. Analyze the user's decision in the context of their profile (risk tolerance, priorities, current situation)
2. Generate 3-5 distinct, realistic future timelines with different outcomes
3. Each timeline should represent a plausible path with clear trade-offs
4. Include both first-order and second-order effects
5. Be balanced - show both positive and negative possibilities
6. Consider emotional, financial, career, relationship, and risk dimensions

For each timeline, provide:
- A memorable title (e.g., "The Bold Leap", "Safe Harbor", "The Balanced Path")
- A 2-3 sentence summary
- Probability (0-100) based on how likely this outcome is given the user's profile
- Metrics (0-100 score + trend for each dimension)
- 4-6 key events across different time periods (3 months, 6 months, 1 year, 2 years, 5 years)
- Key trade-offs
- Second-order effects (unexpected consequences)

Be specific, realistic, and insightful. Avoid generic advice.`;

// Helper function to try a model with fallback
async function tryModelWithFallback(
    contents: string,
    config: { temperature: number; topP?: number; maxOutputTokens: number; responseMimeType?: string }
): Promise<string> {
    if (!ai) {
        throw new AppError('AI service not configured - please set GEMINI_API_KEY', 500);
    }

    let lastError: Error | null = null;

    for (const model of MODEL_FALLBACK_CHAIN) {
        try {
            console.log(`🤖 Trying model: ${model}`);
            const response = await ai.models.generateContent({
                model,
                contents,
                config
            });
            console.log(`✅ Success with model: ${model}`);
            return response.text || '';
        } catch (error) {
            console.warn(`⚠️ Model ${model} failed:`, (error as Error).message);
            lastError = error as Error;
            // Continue to next model in chain
        }
    }

    // All models failed
    throw lastError || new AppError('All AI models failed', 500);
}

export async function generateTimelines(
    decision: string,
    userProfile: UserProfile,
    previousDecisions?: { content: string; category?: string }[]
): Promise<TimelineGenerationResult> {
    if (!ai) {
        throw new AppError('AI service not configured - please set GEMINI_API_KEY', 500);
    }

    const contextPrompt = `
User Profile:
- Risk Tolerance: ${userProfile.riskTolerance}
- Priorities: ${userProfile.priorities.length > 0 ? userProfile.priorities.join(', ') : 'Not specified'}
- Current Situation: ${userProfile.currentSituation || 'Not specified'}

${previousDecisions && previousDecisions.length > 0 ? `
Previous Decisions:
${previousDecisions.map((d, i) => `${i + 1}. ${d.content}${d.category ? ` (${d.category})` : ''}`).join('\n')}
` : ''}

Current Decision: "${decision}"

Generate 3-5 distinct future timelines for this decision. Return ONLY valid JSON matching this exact schema:

{
  "timelines": [
    {
      "title": "string",
      "summary": "string",
      "probability": number,
      "metrics": {
        "emotional": { "score": number, "trend": "up" | "stable" | "down" },
        "financial": { "score": number, "trend": "up" | "stable" | "down" },
        "career": { "score": number, "trend": "up" | "stable" | "down" },
        "relationships": { "score": number, "trend": "up" | "stable" | "down" },
        "risk": { "score": number, "trend": "up" | "stable" | "down" }
      },
      "events": [
        { "period": "string", "description": "string", "impact": "positive" | "neutral" | "negative" }
      ],
      "tradeoffs": ["string"],
      "secondOrderEffects": ["string"]
    }
  ]
}`;

    try {
        const text = await tryModelWithFallback(
            SYSTEM_PROMPT + '\n\n' + contextPrompt,
            {
                temperature: 0.8,
                topP: 0.95,
                maxOutputTokens: 8192,
                responseMimeType: 'application/json',
            }
        );

        // Extract JSON from response with multiple fallback strategies
        let jsonStr = text.trim();

        // Strategy 1: Try markdown code blocks
        const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
        }

        // Strategy 2: Find raw JSON object
        if (!jsonStr.startsWith('{')) {
            const jsonObjectMatch = text.match(/(\{[\s\S]*\})/);
            if (jsonObjectMatch) {
                jsonStr = jsonObjectMatch[1].trim();
            }
        }

        console.log('📝 Parsing JSON response (first 200 chars):', jsonStr.substring(0, 200));

        const result = JSON.parse(jsonStr) as TimelineGenerationResult;

        // Validate structure
        if (!result.timelines || !Array.isArray(result.timelines) || result.timelines.length === 0) {
            throw new Error('Invalid response structure - missing timelines array');
        }

        return result;
    } catch (error) {
        console.error('Gemini API error:', error);
        if (error instanceof SyntaxError) {
            throw new AppError('Failed to parse AI response', 500);
        }
        throw new AppError('Failed to generate timelines: ' + (error instanceof Error ? error.message : 'Unknown error'), 500);
    }
}

export async function regenerateTimelineWithDecision(
    originalDecision: string,
    newDecision: string,
    existingTimeline: GeneratedTimeline,
    userProfile: UserProfile
): Promise<GeneratedTimeline> {
    if (!ai) {
        throw new AppError('AI service not configured', 500);
    }

    const prompt = `
Original Decision: "${originalDecision}"
Selected Timeline: "${existingTimeline.title}" - ${existingTimeline.summary}
New Decision to Inject: "${newDecision}"

User Profile:
- Risk Tolerance: ${userProfile.riskTolerance}
- Priorities: ${userProfile.priorities.join(', ') || 'Not specified'}

Update this timeline to reflect the new decision. The new decision should modify the future events and metrics accordingly. Return ONLY valid JSON matching the timeline schema.`;

    try {
        const text = await tryModelWithFallback(
            SYSTEM_PROMPT + '\n\n' + prompt,
            {
                temperature: 0.7,
                maxOutputTokens: 4096,
            }
        );

        let jsonStr = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1];
        }

        return JSON.parse(jsonStr) as GeneratedTimeline;
    } catch (error) {
        console.error('Gemini API error:', error);
        throw new AppError('Failed to update timeline: ' + (error instanceof Error ? error.message : 'Unknown error'), 500);
    }
}
