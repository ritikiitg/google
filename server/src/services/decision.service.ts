import prisma from '../lib/prisma.js';
import { generateTimelines, UserProfile } from './gemini.service.js';
import { AppError } from '../middleware/error.middleware.js';

export interface CreateDecisionInput {
    content: string;
    category?: string;
    context?: Record<string, unknown>;
}

export async function createDecision(userId: string, input: CreateDecisionInput) {
    // Get user profile for AI context by ritik raj
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            riskTolerance: true,
            priorities: true,
            currentSituation: true,
        }
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Get previous decisions for context
    const previousDecisions = await prisma.decision.findMany({
        where: { userId },
        select: { content: true, category: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
    });

    // Create the decision
    const decision = await prisma.decision.create({
        data: {
            userId,
            content: input.content,
            category: input.category,
            context: input.context ? JSON.stringify(input.context) : null,
        }
    });

    // Generate timelines using AI by ritik raj
    const userProfile: UserProfile = {
        riskTolerance: user.riskTolerance as 'low' | 'medium' | 'high',
        priorities: JSON.parse(user.priorities || '[]'),
        currentSituation: user.currentSituation || undefined,
    };

    const result = await generateTimelines(
        input.content,
        userProfile,
        previousDecisions.map(d => ({ content: d.content, category: d.category || undefined }))
    );

    // Store timelines in database
    const storedTimelines = await Promise.all(
        result.timelines.map(async (timeline, index) => {
            const stored = await prisma.timeline.create({
                data: {
                    decisionId: decision.id,
                    title: timeline.title,
                    summary: timeline.summary,
                    probability: timeline.probability,
                    metrics: JSON.stringify(timeline.metrics),
                    tradeoffs: JSON.stringify(timeline.tradeoffs),
                    secondOrderEffects: JSON.stringify(timeline.secondOrderEffects),
                    events: {
                        create: timeline.events.map((event, eventIndex) => ({
                            order: eventIndex,
                            period: event.period,
                            description: event.description,
                            impact: event.impact,
                        }))
                    }
                },
                include: { events: { orderBy: { order: 'asc' } } }
            });

            return {
                ...stored,
                metrics: JSON.parse(stored.metrics),
                tradeoffs: JSON.parse(stored.tradeoffs),
                secondOrderEffects: JSON.parse(stored.secondOrderEffects),
            };
        })
    );

    return {
        decision: {
            id: decision.id,
            content: decision.content,
            category: decision.category,
            createdAt: decision.createdAt,
        },
        timelines: storedTimelines,
    };
}

export async function getDecisionById(decisionId: string, userId: string) {
    const decision = await prisma.decision.findFirst({
        where: { id: decisionId, userId },
        include: {
            timelines: {
                include: { events: { orderBy: { order: 'asc' } } }
            }
        }
    });

    if (!decision) {
        throw new AppError('Decision not found', 404);
    }

    return {
        ...decision,
        context: decision.context ? JSON.parse(decision.context) : null,
        timelines: decision.timelines.map(t => ({
            ...t,
            metrics: JSON.parse(t.metrics),
            tradeoffs: JSON.parse(t.tradeoffs),
            secondOrderEffects: JSON.parse(t.secondOrderEffects),
        }))
    };
}

export async function getUserDecisions(userId: string) {
    const decisions = await prisma.decision.findMany({
        where: { userId },
        include: {
            timelines: {
                select: { id: true, title: true, probability: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return decisions.map(d => ({
        ...d,
        context: d.context ? JSON.parse(d.context) : null,
    }));
}

export async function injectDecision(
    decisionId: string,
    timelineId: string,
    newDecisionContent: string,
    userId: string
) {
    // Verify ownership
    const originalDecision = await prisma.decision.findFirst({
        where: { id: decisionId, userId }
    });

    if (!originalDecision) {
        throw new AppError('Decision not found', 404);
    }

    const timeline = await prisma.timeline.findFirst({
        where: { id: timelineId, decisionId },
        include: { events: { orderBy: { order: 'asc' } } }
    });

    if (!timeline) {
        throw new AppError('Timeline not found', 404);
    }

    // Get user profile
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { riskTolerance: true, priorities: true, currentSituation: true }
    });

    if (!user) {
        throw new AppError('User not found', 404);
    }

    // Create child decision
    const childDecision = await prisma.decision.create({
        data: {
            userId,
            content: newDecisionContent,
            parentDecisionId: decisionId,
        }
    });

    // Generate new timelines for the injected decision
    const userProfile: UserProfile = {
        riskTolerance: user.riskTolerance as 'low' | 'medium' | 'high',
        priorities: JSON.parse(user.priorities || '[]'),
        currentSituation: user.currentSituation || undefined,
    };

    const result = await generateTimelines(
        `Following my previous decision to "${originalDecision.content}", I now want to: ${newDecisionContent}`,
        userProfile,
        [{ content: originalDecision.content, category: originalDecision.category || undefined }]
    );

    // Store new timelines
    const storedTimelines = await Promise.all(
        result.timelines.map(async (tl) => {
            const stored = await prisma.timeline.create({
                data: {
                    decisionId: childDecision.id,
                    title: tl.title,
                    summary: tl.summary,
                    probability: tl.probability,
                    metrics: JSON.stringify(tl.metrics),
                    tradeoffs: JSON.stringify(tl.tradeoffs),
                    secondOrderEffects: JSON.stringify(tl.secondOrderEffects),
                    events: {
                        create: tl.events.map((event, idx) => ({
                            order: idx,
                            period: event.period,
                            description: event.description,
                            impact: event.impact,
                        }))
                    }
                },
                include: { events: { orderBy: { order: 'asc' } } }
            });

            return {
                ...stored,
                metrics: JSON.parse(stored.metrics),
                tradeoffs: JSON.parse(stored.tradeoffs),
                secondOrderEffects: JSON.parse(stored.secondOrderEffects),
            };
        })
    );

    return {
        decision: childDecision,
        timelines: storedTimelines,
        parentDecisionId: decisionId,
        parentTimelineId: timelineId,
    };
}
