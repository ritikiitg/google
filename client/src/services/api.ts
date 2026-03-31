import type { ApiResponse, AuthResponse, User, Decision, Timeline } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
    private token: string | null = null;

    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (this.token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }

        return data;
    }

    // Auth
    async register(email: string, password: string, name?: string): Promise<ApiResponse<AuthResponse>> {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, name }),
        });
    }

    async login(email: string, password: string): Promise<ApiResponse<AuthResponse>> {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    // User
    async getProfile(): Promise<ApiResponse<User>> {
        return this.request('/user/profile');
    }

    async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
        return this.request('/user/profile', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    // Decisions by ritik raj
    async createDecision(content: string, category?: string): Promise<ApiResponse<{ decision: Decision; timelines: Timeline[] }>> {
        return this.request('/decisions', {
            method: 'POST',
            body: JSON.stringify({ content, category }),
        });
    }

    async getDecisions(): Promise<ApiResponse<Decision[]>> {
        return this.request('/decisions');
    }

    async getDecision(id: string): Promise<ApiResponse<Decision>> {
        return this.request(`/decisions/${id}`);
    }

    async injectDecision(decisionId: string, timelineId: string, newDecision: string): Promise<ApiResponse<{ decision: Decision; timelines: Timeline[] }>> {
        return this.request(`/decisions/${decisionId}/inject`, {
            method: 'POST',
            body: JSON.stringify({ timelineId, newDecision }),
        });
    }

    // Timelines
    async getTimeline(id: string): Promise<ApiResponse<Timeline>> {
        return this.request(`/timelines/${id}`);
    }

    // Feedback by ritik raj
    async submitFeedback(decisionId: string, outcome: string, accuracy?: number, notes?: string): Promise<ApiResponse<unknown>> {
        return this.request('/feedback', {
            method: 'POST',
            body: JSON.stringify({ decisionId, outcome, accuracy, notes }),
        });
    }
}

export const api = new ApiClient();
export default api;
