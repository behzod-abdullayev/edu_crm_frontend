'use client';

// ─── MobileHeader.tsx ───────────────────────────────────────────────────────
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { NotificationBell } from '@shared/components/navigation/NotificationBell';
import { AvatarWithRole } from '@shared/components/data-display/AvatarWithRole';
import { useAuthStore } from '@/store/auth.store';

export function MobileHeader() {
  const t = useTranslations('common');
  const { user } = useAuthStore();

  return (
    <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center justify-between px-4 bg-[var(--bg-surface)] border-b border-[var(--color-border)]">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] rounded">
        <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white font-bold text-xs">
          E
        </div>
        <span className="font-semibold text-[var(--color-text-primary)] text-sm">EduCRM</span>
      </Link>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button
          aria-label={t('search')}
          className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--bg-sidebar-item-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        >
          <Search size={18} aria-hidden="true" />
        </button>
        <NotificationBell />
        {user && <AvatarWithRole user={user} size="sm" />}
      </div>
    </header>
  );
}
