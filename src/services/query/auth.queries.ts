'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { queryKeys } from './keys.factory';
import { authApi, type LoginDto } from '@/services/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';

const QUERY_DEFAULTS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  retry: 2,
  retryDelay: (n: number) => Math.min(1000 * 2 ** n, 30_000),
  refetchOnWindowFocus: false,
  refetchOnMount: true,
} as const;

export function useCurrentUser() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: authApi.getMe,
    enabled: isAuthenticated,
    ...QUERY_DEFAULTS,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { setTokens, setUser } = useAuthStore.getState();
  const addToast = useUIStore((s) => s.addToast);
  const router = useRouter();

  return useMutation({
    mutationFn: (dto: LoginDto) => authApi.login(dto),
    onSuccess: (data) => {
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken, expiresIn: data.expiresIn });
      setUser(data.user);
      queryClient.setQueryData(queryKeys.auth.me, data.user);
      router.push('/dashboard');
    },
    onError: () => {
      addToast({
        type: 'error',
        title: 'auth.loginFailed',
        description: 'auth.loginFailedDescription',
      });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearAuth();
      queryClient.clear();
      router.push('/login');
    },
  });
}

export function useForgotPassword() {
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'auth.forgotPasswordSent',
        description: 'auth.forgotPasswordSentDescription',
        duration: 6000,
      });
    },
    onError: () => {
      addToast({
        type: 'error',
        title: 'auth.forgotPasswordFailed',
      });
    },
  });
}

export function useResetPassword() {
  const addToast = useUIStore((s) => s.addToast);
  const router = useRouter();

  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
    onSuccess: () => {
      addToast({
        type: 'success',
        title: 'auth.passwordResetSuccess',
        duration: 4000,
      });
      router.push('/login');
    },
    onError: () => {
      addToast({
        type: 'error',
        title: 'auth.passwordResetFailed',
      });
    },
  });
}
