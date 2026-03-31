// Shared types between client and server
// Timeline types by ritik raj

export interface TimelineMetric {
    score: number;
    trend: 'up' | 'stable' | 'down';
}

export interface TimelineMetrics {
    emotional: TimelineMetric;
    financial: TimelineMetric;
    career: TimelineMetric;
    relationships: TimelineMetric;
    risk: TimelineMetric;
}

export interface TimelineEvent {
    id: string;
    order: number;
    period: string;
    description: string;
    impact: 'positive' | 'neutral' | 'negative';
}

export interface Timeline {
    id: string;
    decisionId: string;
    title: string;
    summary: string;
    probability: number;
    metrics: TimelineMetrics;
    tradeoffs: string[];
    secondOrderEffects: string[];
    events: TimelineEvent[];
    createdAt: string;
}

export interface Decision {
    id: string;
    userId: string;
    content: string;
    category?: string;
    context?: Record<string, unknown>;
    createdAt: string;
    timelines?: Timeline[];
}

export interface User {
    id: string;
    email: string;
    name?: string;
    riskTolerance: 'low' | 'medium' | 'high';
    priorities: string[];
    currentSituation?: string;
    createdAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        name: string | null;
    };
    token: string;
}
