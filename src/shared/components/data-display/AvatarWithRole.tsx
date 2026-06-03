'use client';

import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@shared/utils/cn';
import { formatInitials } from '@shared/utils/format';
import type { UserProfile } from '@shared/types';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarWithRoleProps {
  user: Pick<UserProfile, 'firstName' | 'lastName' | 'avatar' | 'role'>;
  size?: AvatarSize;
  showRole?: boolean;
  showName?: boolean;
  className?: string;
}

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
  student: 'bg-[var(--role-student, #3b82f6)]',
  teacher: 'bg-[var(--role-teacher, #10b981)]',
  admin:   'bg-[var(--role-admin, #f59e0b)]',
  owner:   'bg-[var(--role-owner, #8b5cf6)]',
};

export function AvatarWithRole({
  user,
  size = 'md',
  showRole = false,
  showName = false,
  className,
}: AvatarWithRoleProps) {
  const initials = formatInitials(user.firstName, user.lastName);
  const roleBg = roleColors[user.role] ?? 'bg-[var(--color-accent)]';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative shrink-0">
        <AvatarPrimitive.Root
          className={cn(
            'rounded-full overflow-hidden flex items-center justify-center bg-[var(--color-accent-subtle)]',
            sizeClasses[size]
          )}
        >
          <AvatarPrimitive.Image
            src={user.avatar}
            alt={`${user.firstName} ${user.lastName}`}
            className="w-full h-full object-cover"
          />
          <AvatarPrimitive.Fallback
            className="flex items-center justify-center w-full h-full font-semibold text-[var(--color-accent)]"
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
              roleBg
            )}
          />
        )}
      </div>

      {showName && (
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] capitalize">{user.role}</p>
        </div>
      )}
    </div>
  );
}
