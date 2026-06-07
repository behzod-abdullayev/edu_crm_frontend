'use client';

/**
 * src/shared/components/navigation/UserMenu.tsx
 *
 * FIX: Replaced all wrong CSS variable names:
 *   --color-ring         → --border-focus
 *   --color-border       → --border-default
 *   --color-text-primary → --text-primary
 *   --color-text-muted   → --text-muted
 *   --color-error        → --error-solid
 *
 * FIX: Profile/settings links now use useLocale() to build locale-aware hrefs
 *      since localePrefix='always' — plain /owner/profile would redirect but
 *      building it correctly avoids the extra redirect hop.
 *
 * FIX: Added t('openMenu') key (now present in userMenu locale section).
 */

import { motion } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTranslations, useLocale } from 'next-intl';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { AvatarWithRole } from '@/shared/components/data-display/AvatarWithRole';
import { cn } from '@/shared/utils/cn';

export function UserMenu() {
  const t = useTranslations('userMenu');
  const locale = useLocale();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const isAdminOrOwner = user.role === 'admin' || user.role === 'owner';

  // Build locale-aware hrefs to avoid extra redirect hops
  const profileHref = `/${locale}/${user.role}/profile`;
  const settingsHref = `/${locale}/${user.role}/settings`;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={t('openMenu')}
          className={cn(
            'flex items-center gap-2 px-2 py-1.5 rounded-lg',
            'hover:bg-[var(--bg-surface-hover)] transition-colors',
            'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
          )}
        >
          <AvatarWithRole user={user} size="sm" />
          <div className="hidden md:block text-left">
            <p className="text-xs font-medium text-[var(--text-primary)] leading-tight">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] capitalize">{user.role}</p>
          </div>
          <ChevronDown
            size={13}
            className="text-[var(--text-muted)] hidden md:block"
            aria-hidden="true"
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content asChild sideOffset={6} align="end">
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'z-50 min-w-52 rounded-xl shadow-[var(--shadow-xl)] overflow-hidden outline-none p-1',
              'bg-[var(--bg-surface)] border border-[var(--border-default)]',
            )}
          >
            {/* User info header */}
            <div className="px-3 py-2.5 mb-1 border-b border-[var(--border-default)]">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
            </div>

            <DropdownMenu.Item asChild>
              <Link
                href={profileHref}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg cursor-pointer',
                  'text-[var(--text-primary)]',
                  'hover:bg-[var(--bg-surface-hover)] transition-colors',
                  'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                )}
              >
                <User size={15} aria-hidden="true" />
                {t('profile')}
              </Link>
            </DropdownMenu.Item>

            {isAdminOrOwner && (
              <DropdownMenu.Item asChild>
                <Link
                  href={settingsHref}
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg cursor-pointer',
                    'text-[var(--text-primary)]',
                    'hover:bg-[var(--bg-surface-hover)] transition-colors',
                    'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                  )}
                >
                  <Settings size={15} aria-hidden="true" />
                  {t('settings')}
                </Link>
              </DropdownMenu.Item>
            )}

            <DropdownMenu.Separator className="my-1 h-px bg-[var(--border-default)]" />

            <DropdownMenu.Item asChild>
              <button
                onClick={logout}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg cursor-pointer',
                  'text-[var(--error-solid)]',
                  'hover:bg-[var(--error-bg)] transition-colors',
                  'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                )}
              >
                <LogOut size={15} aria-hidden="true" />
                {t('logout')}
              </button>
            </DropdownMenu.Item>
          </motion.div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
