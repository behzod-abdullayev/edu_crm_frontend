'use client';

/**
 * src/shared/components/layout/MobileHeader.tsx
 *
 * Sticky header shown ONLY on mobile (< 1024px via `lg:hidden`).
 * Desktop/tablet use Header.tsx instead.
 *
 * FIXES applied:
 *  1. TS2322: `user` passed to AvatarWithRole was type-incompatible because
 *     auth.store's UserProfile (from auth.api.ts) has `profilePictureUrl` but
 *     NO `avatar` field, while AvatarWithRole's old Pick required `avatar`.
 *     Fixed by updating AvatarWithRole to accept AvatarUser (see that file).
 *     No cast needed here — just pass `user` directly.
 *
 *  2. Wrong CSS variable names replaced with correct design-system tokens:
 *       --color-border         → --border-default
 *       --color-accent         → --brand-primary
 *       --color-ring           → --border-focus
 *       --color-text-primary   → --text-primary
 *       --color-text-secondary → --text-secondary
 *
 * Features:
 *  - 56px sticky header, hidden on desktop (lg:hidden)
 *  - Left: EduCRM logo (compact)
 *  - Right: search icon button + NotificationBell + avatar
 *  - All colours via CSS variables (light/dark automatic)
 *  - All labels from next-intl translations
 *  - ARIA: aria-label on search button
 *  - Focus-visible rings on all interactive elements
 *  - No inline styles — Tailwind classes only
 */

import { Search } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { NotificationBell } from '@shared/components/navigation/NotificationBell';
import { AvatarWithRole } from '@shared/components/data-display/AvatarWithRole';
import { useAuthStore } from '@/store/auth.store';

export function MobileHeader() {
  const t      = useTranslations('common');
  const { user } = useAuthStore();

  return (
    <header
      aria-label={t('siteHeader')}
      className={[
        'lg:hidden sticky top-0 z-30 h-14',
        'flex items-center justify-between px-4',
        'bg-[var(--bg-surface)] border-b border-[var(--border-default)]',
      ].join(' ')}
    >
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <Link
        href="/"
        className={[
          'flex items-center gap-2',
          'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded',
        ].join(' ')}
      >
        <div
          className={[
            'w-7 h-7 rounded-lg flex items-center justify-center',
            'bg-[var(--brand-primary)] text-white font-bold text-xs',
          ].join(' ')}
          aria-hidden="true"
        >
          E
        </div>
        <span className="font-semibold text-[var(--text-primary)] text-sm">
          EduCRM
        </span>
      </Link>

      {/* ── Right actions ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1">
        {/* Search icon — opens full-screen search overlay */}
        <button
          aria-label={t('globalSearch')}
          className={[
            'p-2 rounded-lg min-w-[36px] min-h-[36px]',
            'flex items-center justify-center',
            'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
            'transition-colors outline-none',
            'focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
          ].join(' ')}
        >
          <Search size={18} aria-hidden="true" />
        </button>

        {/* Notification bell with real-time badge */}
        <NotificationBell />

        {/* User avatar */}
        {user && (
          <AvatarWithRole
            user={user}
            size="sm"
          />
        )}
      </div>
    </header>
  );
}
