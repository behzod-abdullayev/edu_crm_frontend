import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authApi, type UserProfile, type AuthTokens, type LoginDto } from '@/services/api/auth.api';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setTokens: (tokens: AuthTokens) => void;
  setUser: (user: UserProfile) => void;
  clearAuth: () => void;
  syncMe: () => Promise<void>;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTokens: (tokens: AuthTokens) => {
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        });
        // Re-compute isAuthenticated after token update
        const { user } = get();
        set({ isAuthenticated: !!tokens.accessToken && !!user });
      },

      setUser: (user: UserProfile) => {
        set({ user });
        const { accessToken } = get();
        set({ isAuthenticated: !!accessToken && !!user });
      },

      clearAuth: () => {
        set({ ...initialState });
      },

      syncMe: async () => {
        const { accessToken } = get();
        if (!accessToken) return;

        set({ isLoading: true });
        try {
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          set({ ...initialState });
        }
      },

      login: async (dto: LoginDto) => {
        set({ isLoading: true });
        try {
          const result = await authApi.login(dto);
          set({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          set({ ...initialState });
        }
      },
    }),
    {
      name: 'educrm-auth',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage),
      ),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          // Fire syncMe after hydration to restore user object
          state.syncMe();
        }
      },
    },
  ),
);
