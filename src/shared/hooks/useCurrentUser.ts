'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { authApi } from '@/services/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from '@/services/query/keys.factory';
import type { UserProfile, UserRole, Permission } from '@/services/api/auth.api';

// ─── Query defaults matching global config ────────────────────────────────────

const QUERY_DEFAULTS = {
  staleTime:            5 * 60 * 1_000,   // 5 min — user profile rarely changes
  gcTime:               10 * 60 * 1_000,  // 10 min gc
  retry:                2,
  retryDelay: (attempt: number) => Math.min(1_000 * 2 ** attempt, 30_000),
  refetchOnWindowFocus: false,
  refetchOnMount:       true,
} as const;

// ─── Return shape ─────────────────────────────────────────────────────────────

export interface UseCurrentUserReturn {
  /** Resolved UserProfile or undefined while loading / unauthenticated */
  user: UserProfile | undefined;
  /** True while the /auth/me request is in-flight */
  isLoading: boolean;
  /** True after first successful fetch */
  isSuccess: boolean;
  /** True if the query errored (invalid/expired token, network error) */
  isError: boolean;
  /** Current user role — undefined when not authenticated */
  role: UserRole | undefined;
  /**
   * Permission guard.
   * - Owner always returns true (full access — super-admin bypass).
   * - All others are checked against the permissions[] array from /auth/me.
   * - Returns false when user is undefined (not authenticated).
   */
  can: (permission: Permission) => boolean;
  /** Imperatively invalidate and re-fetch the current user profile */
  refetch: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Primary hook for accessing the authenticated user throughout the app.
 *
 * Architecture:
 *  - Enabled only when `isAuthenticated` is true (Zustand auth store).
 *  - Query key: `queryKeys.auth.me` — can be invalidated from anywhere.
 *  - Cache-patched by the Zustand `setUser` action on login / token refresh.
 *  - Provides a `can(permission)` helper synced with backend permissions[].
 *  - Owner role bypasses all permission checks (super-admin).
 *
 * Usage:
 *  const { user, role, can, isLoading } = useCurrentUser();
 *  if (can('payments:write')) { ... }
 */
export function useCurrentUser(): UseCurrentUserReturn {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient    = useQueryClient();

  const query = useQuery<UserProfile>({
    queryKey: queryKeys.auth.me,
    queryFn:  authApi.getMe,
    enabled:  isAuthenticated,
    ...QUERY_DEFAULTS,
  });

  const user = query.data;

  const can = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;
      if (user.role === 'owner') return true;
      return user.permissions.includes(permission);
    },
    [user],
  );

  const refetch = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
  }, [queryClient]);

  return {
    user,
    isLoading: query.isLoading,
    isSuccess: query.isSuccess,
    isError:   query.isError,
    role:      user?.role,
    can,
    refetch,
  };
}