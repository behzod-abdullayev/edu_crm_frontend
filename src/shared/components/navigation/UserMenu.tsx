'use client';

import { motion } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTranslations } from 'next-intl';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { AvatarWithRole } from '@shared/components/data-display/AvatarWithRole';
import { cn } from '@shared/utils/cn';

export function UserMenu() {
  const t = useTranslations('userMenu');
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const isAdminOrOwner = user.role === 'admin' || user.role === 'owner';

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={t('openMenu')}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--bg-sidebar-item-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        >
          <AvatarWithRole user={user} size="sm" />
          <div className="hidden md:block text-left">
            <p className="text-xs font-medium text-[var(--color-text-primary)] leading-tight">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[10px] text-[var(--color-text-muted)] capitalize">{user.role}</p>
          </div>
          <ChevronDown size={13} className="text-[var(--color-text-muted)] hidden md:block" aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content asChild sideOffset={6} align="end">
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="z-50 min-w-52 bg-[var(--bg-surface)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden outline-none p-1"
          >
            {/* User info header */}
            <div className="px-3 py-2.5 mb-1 border-b border-[var(--color-border)]">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
            </div>

            <DropdownMenu.Item asChild>
              <Link
                href={`/${user.role}/profile`}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--bg-sidebar-item-hover)] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                <User size={15} aria-hidden="true" />
                {t('profile')}
              </Link>
            </DropdownMenu.Item>

            {isAdminOrOwner && (
              <DropdownMenu.Item asChild>
                <Link
                  href={`/${user.role}/settings`}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--bg-sidebar-item-hover)] transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                >
                  <Settings size={15} aria-hidden="true" />
                  {t('settings')}
                </Link>
              </DropdownMenu.Item>
            )}

            <DropdownMenu.Separator className="my-1 h-px bg-[var(--color-border)]" />

            <DropdownMenu.Item asChild>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--color-error)] rounded-lg hover:bg-[var(--color-error)]/10 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
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
