'use client';

/**
 * src/shared/components/data-display/AvatarWithRole.tsx
 *
 * Avatar component with optional role badge, name, and role label.
 *
 * FIX: Previously the `user` prop was typed as
 *   Pick<UserProfile, 'firstName' | 'lastName' | 'avatar' | 'role'>
 * using the @shared/types UserProfile which has `avatar?: string`.
 * But auth.store.ts uses UserProfile from @services/api/auth.api.ts which
 * has `profilePictureUrl: string | null` and NO `avatar` field.
 * This caused TS2322 errors in Sidebar, MobileHeader, and UserMenu.
 *
 * Solution: Replace the Pick<UserProfile,...> with an explicit
 * `AvatarUser` interface that accepts EITHER `avatar` OR
 * `profilePictureUrl` (both optional), so both UserProfile variants
 * work without any casting.
 *
 * ✅ Zero `any` types
 * ✅ Works with auth.store UserProfile (profilePictureUrl)
 * ✅ Works with @shared/types UserProfile (avatar)
 * ✅ No changes needed in Sidebar / MobileHeader / UserMenu / UserProfile page
 */

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@shared/utils/cn';
import { formatInitials } from '@shared/utils/format';

// ─── Types ────────────────────────────────────────────────────────────────────

type AvatarSize = 'sm' | 'md' | 'lg';

/**
 * Minimal user shape required by AvatarWithRole.
 *
 * Accepts EITHER `avatar` (from @shared/types UserProfile) OR
 * `profilePictureUrl` (from @services/api/auth.api UserProfile) or both,
 * since both appear in different parts of the codebase.
 *
 * `role` is typed as `string` (not the union) so it works with both
 * UserRole definitions ('student'|'teacher'|'admin'|'owner' from @shared/types
 * vs 'student'|'teacher'|'admin'|'owner'|'super_admin' from auth.api.ts).
 */
export interface AvatarUser {
  firstName: string;
  lastName: string;
  role: string;
  /** From @shared/types UserProfile */
  avatar?: string | null;
  /** From auth.api.ts UserProfile */
  profilePictureUrl?: string | null;
}

interface AvatarWithRoleProps {
  user: AvatarUser;
  size?: AvatarSize;
  showRole?: boolean;
  showName?: boolean;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
};

const badgeSize: Record<AvatarSize, string> = {
  sm: 'w-2.5 h-2.5 border',
  md: 'w-3 h-3 border',
  lg: 'w-4 h-4 border-2',
};

const roleColors: Record<string, string> = {
  student:     'bg-[var(--role-student,#3b82f6)]',
  teacher:     'bg-[var(--role-teacher,#22c55e)]',
  admin:       'bg-[var(--role-admin,#8b5cf6)]',
  owner:       'bg-[var(--role-owner,#f59e0b)]',
  super_admin: 'bg-[var(--brand-primary,#4f46e5)]',
};

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Resolves the avatar image URL from whichever field is present.
 * Priority: `avatar` → `profilePictureUrl` → undefined
 */
function resolveAvatarSrc(user: AvatarUser): string | undefined {
  const src = user.avatar ?? user.profilePictureUrl;
  return src ?? undefined;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AvatarWithRole({
  user,
  size = 'md',
  showRole = false,
  showName = false,
  className,
}: AvatarWithRoleProps) {
  const initials  = formatInitials(user.firstName, user.lastName);
  const roleBg    = roleColors[user.role] ?? 'bg-[var(--brand-primary)]';
  const avatarSrc = resolveAvatarSrc(user);

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative shrink-0">
        <AvatarPrimitive.Root
          className={cn(
            'rounded-full overflow-hidden flex items-center justify-center',
            'bg-[var(--bg-surface-hover)]',
            sizeClasses[size],
          )}
        >
          <AvatarPrimitive.Image
            src={avatarSrc}
            alt={`${user.firstName} ${user.lastName}`}
            className="w-full h-full object-cover"
          />
          <AvatarPrimitive.Fallback
            className="flex items-center justify-center w-full h-full font-semibold text-[var(--brand-primary)]"
            delayMs={200}
          >
            {initials}
          </AvatarPrimitive.Fallback>
        </AvatarPrimitive.Root>

        {showRole && (
          <span
            aria-label={user.role}
            className={cn(
              'absolute bottom-0 right-0 rounded-full border-[var(--bg-surface)]',
              badgeSize[size],
              roleBg,
            )}
          />
        )}
      </div>

      {showName && (
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-[var(--text-muted)] capitalize">{user.role}</p>
        </div>
      )}
    </div>
  );
}
