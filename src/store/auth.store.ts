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

      /**
       * setTokens — token ni store ga saqlash.
       * isAuthenticated ni faqat token VA user mavjud bo'lgandagina true qilish.
       */
      setTokens: (tokens: AuthTokens) => {
        const { user } = get();
        set({
          accessToken:     tokens.accessToken,
          refreshToken:    tokens.refreshToken,
          // user mavjud bo'lganda isAuthenticated=true, bo'lmasa false
          // (setUser keyinroq chaqirilganda true bo'ladi)
          isAuthenticated: !!tokens.accessToken && !!user,
        });
      },

      /**
       * setUser — user profilini store ga saqlash.
       * Bu chaqirilganda isAuthenticated ni to'g'ri hisoblash.
       */
      setUser: (user: UserProfile) => {
        const { accessToken } = get();
        set({
          user,
          // accessToken mavjud bo'lsa yoki cookie orqali authenticated bo'lsa
          // isAuthenticated = true. LoginClient.tsx HTTP-only cookie ishlatganda
          // accessToken = '' (bo'sh) bo'lishi mumkin, shuning uchun user mavjudligi yetarli.
          isAuthenticated: true,
        });
        // accessToken ni ham saqlaymiz (agar cookie-based bo'lsa, bo'sh string)
        if (!accessToken && user) {
          // Cookie-based auth: token localStorage da emas, cookie da
          // isAuthenticated = true qoladi
        }
      },

      clearAuth: () => {
        set({ ...initialState });
      },

      /**
       * syncMe — localStorage dagi token bilan backend dan user profilini tiklash.
       *
       * Logika:
       * 1. accessToken yo'q va cookie ham yo'q → hech narsa qilma
       * 2. /api/auth/me ga murojaat qil
       * 3. Muvaffaqiyatli → user ni set qil, isAuthenticated = true
       * 4. 401/403 → auth tozala
       * 5. Network xato (502, undefined) → loading = false, token saqlash
       */
      syncMe: async () => {
        set({ isLoading: true });
        try {
          const user = await authApi.getMe();
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err: unknown) {
          const status = (err as { statusCode?: number })?.statusCode;
          if (status === 401 || status === 403) {
            // Token yaroqsiz — auth tozala
            set({ ...initialState });
          } else {
            // Network xato — token saqlanib qolsin, faqat loading off
            set({ isLoading: false });
          }
        }
      },

      /**
       * login — to'g'ridan backend API orqali login.
       * LoginClient.tsx bu o'rniga /api/auth/login fetch dan foydalanadi.
       * Bu metod to'g'ridan axios orqali chaqirilganda ishlatiladi.
       */
      login: async (dto: LoginDto) => {
        set({ isLoading: true });
        try {
          const result = await authApi.login(dto);
          set({
            accessToken:     result.accessToken,
            refreshToken:    result.refreshToken,
            user:            result.user,
            isAuthenticated: true,
            isLoading:       false,
          });
        } catch (error: unknown) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Cookie tozalash uchun /api/auth/logout ga murojaat
          await fetch('/api/auth/logout', {
            method:      'POST',
            credentials: 'include',
          });
        } catch {
          // Logout xatosi — baribir auth ni tozalamiz
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
      // Faqat token larni localStorage ga saqlash (user objecti emas)
      partialize: (state) => ({
        accessToken:  state.accessToken,
        refreshToken: state.refreshToken,
      }),
      // localStorage dan rehydrate bo'lganda syncMe chaqirish
      onRehydrateStorage: () => (state) => {
        // accessToken mavjud bo'lsa, backend dan user profilini tiklash urinish
        // Cookie-based auth da ham ishlaydi (accessToken bo'sh bo'lsa ham /api/auth/me
        // HTTP-only cookie ni ishlatadi)
        if (state) {
          // syncMe ni sync chaqirib bo'lmaydi, shuning uchun void
          void state.syncMe();
        }
      },
    },
  ),
);
