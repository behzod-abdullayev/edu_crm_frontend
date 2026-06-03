'use client';

/**
 * src/shared/components/layout/Header.tsx
 *
 * Desktop & Tablet sticky header — hidden on mobile (<640px).
 * Mobile uses MobileHeader instead (56px, compact).
 *
 * Features:
 *  - Sticky top, z-30, 64px height
 *  - Left: sidebar toggle button (hamburger with animated icon) + Breadcrumb
 *  - Center: GlobalSearch (Cmd+K modal search, hidden below md)
 *  - Right: NotificationBell + ThemeToggle + LanguageSwitcher + vertical divider + UserMenu
 *  - Framer Motion whileTap on toggle button
 *  - Full ARIA: aria-label on header, aria-label + aria-expanded on toggle button
 *  - Focus-visible rings on all interactive elements
 *  - All text from next-intl translations (zero hardcoded strings)
 *  - CSS variables for all colors (light/dark mode automatic)
 */

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Breadcrumb } from '@/shared/components/layout/Breadcrumb';
import { GlobalSearch } from '@/shared/components/navigation/GlobalSearch';
import { NotificationBell } from '@/shared/components/navigation/NotificationBell';
import { ThemeToggle } from '@/shared/components/navigation/ThemeToggle';
import { LanguageSwitcher } from '@/shared/components/navigation/LanguageSwitcher';
import { UserMenu } from '@/shared/components/navigation/UserMenu';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HeaderProps {
  /** Whether the sidebar is currently collapsed */
  collapsed: boolean;
  /** Callback to toggle sidebar collapsed state */
  onToggle: () => void;
}

// ─── Hamburger Icon ───────────────────────────────────────────────────────────

/** Three-line hamburger icon with smooth Framer Motion morphing animation */
function HamburgerIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="w-5 h-5 flex flex-col justify-center items-center gap-[5px]" aria-hidden="true">
      {/* Top bar */}
      <motion.span
        animate={{
          rotate: collapsed ? 0 : 0,
          width: collapsed ? 20 : 20,
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        style={{
          display: 'block',
          height: 1.5,
          width: 20,
          borderRadius: 2,
          background: 'currentColor',
          transformOrigin: 'center',
        }}
      />
      {/* Middle bar — width changes to indicate collapse state */}
      <motion.span
        animate={{ width: collapsed ? 14 : 20 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        style={{
          display: 'block',
          height: 1.5,
          borderRadius: 2,
          background: 'currentColor',
        }}
      />
      {/* Bottom bar */}
      <motion.span
        animate={{ width: collapsed ? 20 : 20 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        style={{
          display: 'block',
          height: 1.5,
          width: 20,
          borderRadius: 2,
          background: 'currentColor',
        }}
      />
    </div>
  );
}

// ─── Header Component ─────────────────────────────────────────────────────────

export function Header({ collapsed, onToggle }: HeaderProps) {
  const t = useTranslations('common');

  return (
    <header
      aria-label={t('siteHeader')}
      // Hidden on mobile — MobileHeader handles < 640px
      // Visible on tablet and desktop (≥ 640px)
      className="hidden sm:flex sticky top-0 z-30 h-16 items-center gap-3 bg-[var(--bg-surface)] border-b border-[var(--border-default)] shrink-0"
      style={{ paddingLeft: 16, paddingRight: 16 }}
    >
      {/* ── Left section: toggle + breadcrumb ────────────────────────── */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {/* Sidebar toggle button */}
        <motion.button
          onClick={onToggle}
          aria-label={collapsed ? t('expandSidebar') : t('collapseSidebar')}
          aria-expanded={!collapsed}
          aria-controls="main-sidebar"
          whileTap={{ scale: 0.90 }}
          whileHover={{ backgroundColor: 'var(--bg-surface-hover)' }}
          style={{
            padding: 8,
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 36,
            minHeight: 36,
            flexShrink: 0,
            transition: 'color 150ms ease',
            outline: 'none',
          }}
          className="focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
        >
          <HamburgerIcon collapsed={collapsed} />
        </motion.button>

        {/* Breadcrumb navigation */}
        <div className="min-w-0 flex-1">
          <Breadcrumb />
        </div>
      </div>

      {/* ── Center section: Global Search ────────────────────────────── */}
      {/* Hidden below md, visible at md+ (768px+) */}
      <div className="hidden md:flex flex-1 max-w-xs xl:max-w-sm">
        <GlobalSearch className="w-full" />
      </div>

      {/* ── Right section: action buttons ─────────────────────────────── */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* Notification bell with real-time badge */}
        <NotificationBell />

        {/* Theme toggle: light / dark / system */}
        <ThemeToggle />

        {/* Language switcher: uz / ru / en */}
        <LanguageSwitcher />

        {/* Vertical divider */}
        <div
          className="w-px h-6 bg-[var(--border-default)] mx-1.5"
          aria-hidden="true"
        />

        {/* User menu dropdown */}
        <UserMenu />
      </div>
    </header>
  );
}
