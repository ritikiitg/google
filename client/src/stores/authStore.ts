import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import type { User } from '../types';

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name?: string) => Promise<void>;
    logout: () => void;
    fetchProfile: () => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isLoading: false,
            error: null,

            login: async (email, password) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.login(email, password);
                    if (response.data) {
                        api.setToken(response.data.token);
                        set({
                            token: response.data.token,
                            user: response.data.user as unknown as User,
                            isLoading: false
                        });
                        // Fetch full profile
                        await get().fetchProfile();
                    }
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Login failed',
                        isLoading: false
                    });
                    throw error;
                }
            },

            register: async (email, password, name) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.register(email, password, name);
                    if (response.data) {
                        api.setToken(response.data.token);
                        set({
                            token: response.data.token,
                            user: response.data.user as unknown as User,
                            isLoading: false
                        });
                        await get().fetchProfile();
                    }
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Registration failed',
                        isLoading: false
                    });
                    throw error;
                }
            },

            logout: () => {
                api.setToken(null);
                set({ user: null, token: null, error: null });
            },

            fetchProfile: async () => {
                try {
                    const response = await api.getProfile();
                    if (response.data) {
                        set({ user: response.data });
                    }
                } catch (error) {
                    console.error('Failed to fetch profile:', error);
                }
            },

            updateProfile: async (data) => {
                set({ isLoading: true, error: null });
                try {
                    const response = await api.updateProfile(data);
                    if (response.data) {
                        set({ user: response.data, isLoading: false });
                    }
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : 'Update failed',
                        isLoading: false
                    });
                    throw error;
                }
            },

            clearError: () => set({ error: null }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token }),
        }
    )
);
