/**
 * @file src/modules/auth/hooks/useAuth.ts
 *
 * Thin wrapper around `useAuthStore` (Zustand).
 *
 * WHY THIS EXISTS
 * ───────────────
 * All client components across admin, owner, teacher and student routes
 * import authentication state from this single hook.  Having a dedicated
 * wrapper means:
 *   1. The Zustand store implementation can change without touching consumers.
 *   2. Extra derived values (e.g. `fullName`, `can`) are co-located here.
 *   3. TypeScript consumers always deal with the stable `UseAuthReturn` shape.
 *
 * USAGE
 * ─────
 * import { useAuth } from '@/modules/auth/hooks/useAuth';
 *
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *   ...
 * }
 *
 * DO NOT use `useAuthStore` directly in components — always go through
 * this hook so that refactors remain contained.
 */

'use client';

import { useAuthStore } from '@/store/auth.store';
import type { UserProfile, LoginDto, Permission, UserRole } from '@/services/api/auth.api';

// ── Public return type ────────────────────────────────────────────────────────

export interface UseAuthReturn {
  /**
   * The currently authenticated user.
   * `null` when unauthenticated or during initial token hydration.
   */
  user: UserProfile | null;

  /** True once a valid access token is present and the user has been fetched. */
  isAuthenticated: boolean;

  /**
   * True while the auth store is executing an async operation
   * (login, logout, syncMe / token refresh).
   * Use this to show loading spinners on auth-gated pages.
   */
  isLoading: boolean;

  /**
   * Convenience: `"${user.firstName} ${user.lastName}"`.
   * Returns an empty string when the user is not loaded.
   */
  fullName: string;

  /**
   * Convenience: the authenticated user's role.
   * Returns `null` when unauthenticated.
   */
  role: UserRole | null;

  /**
   * Convenience: the authenticated user's tenant ID.
   * Returns `null` when unauthenticated.
   */
  tenantId: string | null;

  /**
   * Check whether the current user holds a specific permission.
   * Owners automatically return `true` for every permission check.
   * Returns `false` when unauthenticated.
   *
   * @example
   * if (can('payment.manage')) { ... }
   */
  can: (permission: Permission) => boolean;

  /**
   * Check whether the current user holds **at least one** of the given
   * permissions.  Returns `false` when unauthenticated.
   *
   * @example
   * if (canAny(['course.create', 'course.update'])) { ... }
   */
  canAny: (permissions: Permission[]) => boolean;

  /**
   * Check whether the current user holds **all** of the given permissions.
   * Returns `false` when unauthenticated.
   *
   * @example
   * if (canAll(['report.view', 'report.export'])) { ... }
   */
  canAll: (permissions: Permission[]) => boolean;

  /**
   * Authenticate with email + password credentials.
   * On success the store is populated with tokens and user data.
   * On failure the Promise rejects with a mapped ApiError.
   *
   * @param dto - `{ email, password }` — `tenantSlug` is optional and
   *              resolved automatically by the Axios interceptor.
   */
  login: (dto: LoginDto) => Promise<void>;

  /**
   * Sign the current user out.
   * Calls POST /auth/logout then wipes the store and localStorage tokens.
   */
  logout: () => Promise<void>;

  /**
   * Re-fetch the current user profile from GET /auth/me.
   * Useful after a profile update to sync the store without a full page reload.
   */
  syncMe: () => Promise<void>;
}

// ── Hook implementation ───────────────────────────────────────────────────────

/**
 * Returns authentication state and actions for the currently signed-in user.
 *
 * This hook subscribes to the minimum set of Zustand slices it needs so that
 * components only re-render when the data they actually use changes.
 */
/**
 * State shape inferred directly from the store so we don't have to export
 * the private `AuthStore` type from auth.store.ts.
 */
type AuthStoreState = ReturnType<typeof useAuthStore.getState>;

export function useAuth(): UseAuthReturn {
  // Each selector is a separate subscription so renders are as surgical as possible.
  // Explicit parameter type satisfies strict: true / noImplicitAny without requiring
  // AuthStore to be exported from auth.store.ts.
  const user            = useAuthStore((s: AuthStoreState) => s.user);
  const isAuthenticated = useAuthStore((s: AuthStoreState) => s.isAuthenticated);
  const isLoading       = useAuthStore((s: AuthStoreState) => s.isLoading);
  const login           = useAuthStore((s: AuthStoreState) => s.login);
  const logout          = useAuthStore((s: AuthStoreState) => s.logout);
  const syncMe          = useAuthStore((s: AuthStoreState) => s.syncMe);

  // ── Derived values ────────────────────────────────────────────────────────

  const fullName: string = user
    ? `${user.firstName} ${user.lastName}`.trim()
    : '';

  const role: UserRole | null = user?.role ?? null;

  const tenantId: string | null = user?.tenantId ?? null;

  // ── Permission helpers ────────────────────────────────────────────────────

  const can = (permission: Permission): boolean => {
    if (!user) return false;
    if (user.role === 'owner') return true;
    return user.permissions.includes(permission);
  };

  const canAny = (permissions: Permission[]): boolean =>
    permissions.some((p) => can(p));

  const canAll = (permissions: Permission[]): boolean =>
    permissions.every((p) => can(p));

  // ── Return ────────────────────────────────────────────────────────────────

  return {
    user,
    isAuthenticated,
    isLoading,
    fullName,
    role,
    tenantId,
    can,
    canAny,
    canAll,
    login,
    logout,
    syncMe,
  };
}