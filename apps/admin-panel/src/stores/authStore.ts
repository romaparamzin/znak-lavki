/**
 * Auth Store (Zustand)
 * Manages authentication state
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { User } from '../types/auth.types';
import { authService } from '../features/auth/authService';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        login: async () => {
          set({ isLoading: true, error: null });
          try {
            await authService.login();
            const user = await authService.getCurrentUser();
            set({ user, isAuthenticated: true, isLoading: false });
          } catch (error: any) {
            set({ 
              error: error.message || 'Login failed', 
              isLoading: false 
            });
            throw error;
          }
        },

        logout: async () => {
          set({ isLoading: true });
          try {
            await authService.logout();
          } finally {
            set({ 
              user: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }
        },

        setUser: (user) => set({ 
          user, 
          isAuthenticated: !!user 
        }),

        clearError: () => set({ error: null }),

        checkAuth: () => {
          const isAuth = authService.isAuthenticated();
          const user = authService.getCurrentUserFromStorage();
          set({ isAuthenticated: isAuth, user });
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          user: state.user, 
          isAuthenticated: state.isAuthenticated 
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

