'use client';

/**
 * src/shared/components/layout/Sidebar.tsx
 *
 * Full-featured sidebar navigation component.
 *
 * Features:
 *  - Desktop (≥1024px): visible, collapsible (260px ↔ 72px) with Framer Motion animation
 *  - Tablet (640–1023px): always 72px icons-only (collapsed prop passed as true)
 *  - Mobile (<640px): HIDDEN — navigation is via MobileBottomNav
 *  - Role-based nav config (student / teacher / admin / owner)
 *  - Active route detection with animated sliding indicator (layoutId)
 *  - Radix Tooltip on icon-only (collapsed) items
 *  - User profile section at bottom with logout
 *  - Framer Motion: expand/collapse label fade, logo crossfade, active indicator slide
 *  - Full ARIA: role="navigation", aria-current="page", aria-label, aria-expanded
 *  - Focus-visible ring on all interactive elements
 *  - All text from next-intl translations (zero hardcoded strings)
 *
 * FIX: Toggle button moved outside the `overflow-hidden` aside so it is
 *      fully visible and not clipped. It now lives in a relative wrapper div.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  ClipboardCheck,
  BookMarked,
  GraduationCap,
  FileText,
  Award,
  Bell,
  User,
  Users,
  Layers,
  MessageSquare,
  BarChart2,
  Settings,
  DollarSign,
  Briefcase,
  Monitor,
  LogOut,
  Building2,
  ChevronLeft,
} from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { AvatarWithRole } from '@/shared/components/data-display/AvatarWithRole';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/shared/utils/cn';
import type { UserRole } from '@/shared/types/common.types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SidebarProps {
  role: UserRole;
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  key: string;
  href: string;
  icon: React.ElementType;
}

interface NavGroup {
  key: string;
  items: NavItem[];
}

// ─── Navigation Configuration ─────────────────────────────────────────────────

const NAV_CONFIG: Record<UserRole, NavGroup[]> = {
  student: [
    {
      key: 'main',
      items: [
        { key: 'dashboard', href: '/student/dashboard', icon: LayoutDashboard },
        { key: 'courses', href: '/student/courses', icon: BookOpen },
        { key: 'schedule', href: '/student/schedule', icon: Calendar },
        { key: 'attendance', href: '/student/attendance', icon: ClipboardCheck },
        { key: 'homework', href: '/student/homework', icon: BookMarked },
      ],
    },
    {
      key: 'academic',
      items: [
        { key: 'grades', href: '/student/grades', icon: GraduationCap },
        { key: 'exams', href: '/student/exams', icon: FileText },
        { key: 'certificates', href: '/student/certificates', icon: Award },
      ],
    },
    {
      key: 'personal',
      items: [
        { key: 'notifications', href: '/student/notifications', icon: Bell },
        { key: 'profile', href: '/student/profile', icon: User },
      ],
    },
  ],
  teacher: [
    {
      key: 'main',
      items: [
        { key: 'dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
        { key: 'myGroups', href: '/teacher/groups', icon: Users },
        { key: 'attendance', href: '/teacher/attendance', icon: ClipboardCheck },
        { key: 'homework', href: '/teacher/homework', icon: BookMarked },
        { key: 'lessons', href: '/teacher/lessons', icon: BookOpen },
      ],
    },
    {
      key: 'academic',
      items: [
        { key: 'students', href: '/teacher/students', icon: GraduationCap },
        { key: 'exams', href: '/teacher/exams', icon: FileText },
        { key: 'chat', href: '/teacher/chat', icon: MessageSquare },
      ],
    },
    {
      key: 'insights',
      items: [
        { key: 'analytics', href: '/teacher/analytics', icon: BarChart2 },
        { key: 'profile', href: '/teacher/profile', icon: User },
      ],
    },
  ],
  admin: [
    {
      key: 'main',
      items: [
        { key: 'dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { key: 'courses', href: '/admin/courses', icon: BookOpen },
        { key: 'teachers', href: '/admin/teachers', icon: Users },
        { key: 'students', href: '/admin/students', icon: GraduationCap },
        { key: 'schedule', href: '/admin/schedule', icon: Calendar },
      ],
    },
    {
      key: 'management',
      items: [
        { key: 'payments', href: '/admin/payments', icon: DollarSign },
        { key: 'reports', href: '/admin/reports', icon: FileText },
        { key: 'analytics', href: '/admin/analytics', icon: BarChart2 },
        { key: 'settings', href: '/admin/settings', icon: Settings },
      ],
    },
  ],
  owner: [
    {
      key: 'main',
      items: [
        { key: 'dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
        { key: 'users', href: '/owner/users', icon: Users },
        { key: 'roles', href: '/owner/roles', icon: Layers },
        { key: 'branches', href: '/owner/branches', icon: Building2 },
      ],
    },
    {
      key: 'business',
      items: [
        { key: 'analytics', href: '/owner/analytics', icon: BarChart2 },
        { key: 'finances', href: '/owner/finances', icon: DollarSign },
        { key: 'hr', href: '/owner/hr', icon: Briefcase },
        { key: 'system', href: '/owner/system', icon: Monitor },
      ],
    },
  ],
};

// ─── Nav Item Component ───────────────────────────────────────────────────────

interface NavItemComponentProps {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
}

function NavItemComponent({ item, collapsed, isActive }: NavItemComponentProps) {
  const t = useTranslations('nav');
  const locale = useLocale();
  const Icon = item.icon;

  const linkContent = (
    <Link
      href={`/${locale}${item.href}`}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'relative flex items-center gap-3 rounded-lg text-sm font-medium',
        'transition-colors duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
        'min-h-[40px]',
        collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
        isActive
          ? 'text-[var(--text-sidebar-active)]'
          : 'text-[var(--text-sidebar)] hover:bg-[var(--bg-sidebar-item-hover)] hover:text-[var(--text-sidebar-active)]',
      )}
    >
      {/* Animated active background */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-bg"
          className="absolute inset-0 bg-[var(--bg-sidebar-item-active)] rounded-lg"
          style={{ zIndex: 0 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
        />
      )}

      {/* Left active accent bar */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            key="accent-bar"
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--brand-secondary)] rounded-r-full"
            style={{ zIndex: 1 }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Icon */}
      <Icon
        size={18}
        className="relative shrink-0"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      />

      {/* Label (hidden when collapsed) */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            key="label"
            initial={{ opacity: 0, width: 0 }}
            animate={{
              opacity: 1,
              width: 'auto',
              transition: { delay: 0.1, duration: 0.15, ease: 'easeOut' },
            }}
            exit={{
              opacity: 0,
              width: 0,
              transition: { duration: 0.1, ease: 'easeIn' },
            }}
            className="relative truncate overflow-hidden whitespace-nowrap"
            style={{ zIndex: 1 }}
          >
            {t(item.key)}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );

  // Wrap with tooltip when collapsed
  if (collapsed) {
    return (
      <Tooltip.Root delayDuration={300}>
        <Tooltip.Trigger asChild>
          {linkContent}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="right"
            sideOffset={10}
            className={cn(
              'z-50 rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-lg',
              'bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)]',
              'animate-in fade-in-0 zoom-in-95',
            )}
          >
            {t(item.key)}
            <Tooltip.Arrow className="fill-[var(--bg-surface)]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  }

  return linkContent;
}

// ─── Nav Group Component ──────────────────────────────────────────────────────

interface NavGroupComponentProps {
  group: NavGroup;
  collapsed: boolean;
  pathname: string;
}

function NavGroupComponent({ group, collapsed, pathname }: NavGroupComponentProps) {
  const t = useTranslations('nav');
  const locale = useLocale();
  // Strip the locale prefix so "/en/teacher/groups" matches href "/teacher/groups"
  const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '') || '/';

  return (
    <div>
      {/* Group header label */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.p
            key={`group-header-${group.key}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: 1,
              height: 'auto',
              transition: { delay: 0.12, duration: 0.15 },
            }}
            exit={{ opacity: 0, height: 0, transition: { duration: 0.1 } }}
            className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-sidebar)] opacity-60 truncate overflow-hidden"
            aria-hidden="true"
          >
            {t(`sections.${group.key}`)}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Group items */}
      <ul className="space-y-0.5 list-none p-0 m-0" role="list">
        {group.items.map((item) => (
          <li key={item.key}>
            <NavItemComponent
              item={item}
              collapsed={collapsed}
              isActive={pathWithoutLocale.startsWith(item.href)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Sidebar Toggle Button ────────────────────────────────────────────────────
// FIX: This button is rendered OUTSIDE the overflow-hidden aside element,
// positioned absolutely relative to the sidebar wrapper div instead.

interface ToggleButtonProps {
  collapsed: boolean;
  onToggle: () => void;
  labelExpand: string;
  labelCollapse: string;
}

function ToggleButton({
  collapsed,
  onToggle,
  labelExpand,
  labelCollapse,
}: ToggleButtonProps) {
  return (
    <Tooltip.Root delayDuration={300}>
      <Tooltip.Trigger asChild>
        <motion.button
          onClick={onToggle}
          aria-label={collapsed ? labelExpand : labelCollapse}
          aria-expanded={!collapsed}
          whileTap={{ scale: 0.92 }}
          className={cn(
            // Positioned at the right edge of the sidebar, vertically at logo area bottom
            'absolute right-0 translate-x-1/2 top-[76px] z-20',
            'w-6 h-6 rounded-full flex items-center justify-center',
            'bg-[var(--bg-surface)] border border-[var(--border-default)]',
            'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
            'shadow-sm hover:shadow-md transition-all duration-150',
            'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            // Hidden on tablet (sidebar is always collapsed on tablet)
            'hidden lg:flex',
          )}
        >
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <ChevronLeft size={12} aria-hidden="true" />
          </motion.div>
        </motion.button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="right"
          sideOffset={8}
          className="z-50 rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-lg bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] animate-in fade-in-0 zoom-in-95"
        >
          {collapsed ? labelExpand : labelCollapse}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

// ─── Main Sidebar Component ───────────────────────────────────────────────────

export function Sidebar({ role, collapsed, onToggle }: SidebarProps) {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const locale = useLocale();
  const { user, logout } = useAuthStore();
  const groups = NAV_CONFIG[role] ?? [];

  // Sidebar width values
  const EXPANDED_WIDTH = 260;
  const COLLAPSED_WIDTH = 72;

  return (
    <Tooltip.Provider>
      {/*
        FIX: Outer wrapper is `relative` and does NOT have overflow-hidden.
        This allows the toggle button (which uses absolute positioning with
        translate-x-1/2 to peek out) to be fully visible.
        The inner <motion.aside> handles the overflow-hidden for the sidebar content.
      */}
      <div className="relative hidden sm:flex shrink-0 h-screen sticky top-0">
        {/* ── Toggle button (desktop only) — outside overflow-hidden ── */}
        <ToggleButton
          collapsed={collapsed}
          onToggle={onToggle}
          labelExpand={tCommon('expandSidebar')}
          labelCollapse={tCommon('collapseSidebar')}
        />

        <motion.aside
          id="main-sidebar"
          role="navigation"
          aria-label={tCommon('mainNavigation')}
          aria-expanded={!collapsed}
          className="flex flex-col h-full overflow-hidden bg-[var(--bg-sidebar)] border-r border-white/5"
          animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
        >
          {/* ── Logo area ─────────────────────────────────────────────── */}
          <div
            className={cn(
              'flex items-center h-16 border-b border-white/5 shrink-0 overflow-hidden',
              collapsed ? 'justify-center px-2' : 'px-4',
            )}
          >
            <AnimatePresence mode="wait" initial={false}>
              {collapsed ? (
                <motion.div
                  key="logo-collapsed"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1, transition: { delay: 0.1 } }}
                  exit={{ opacity: 0, scale: 0.7, transition: { duration: 0.1 } }}
                  className="w-9 h-9 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center shrink-0"
                  aria-label="EduCRM"
                >
                  <span className="text-white font-bold text-sm" aria-hidden="true">
                    E
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="logo-expanded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.12 } }}
                  exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  className="flex items-center gap-2.5 min-w-0"
                >
                  <div
                    className="w-8 h-8 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <span className="text-white font-bold text-sm">E</span>
                  </div>
                  <span className="font-bold text-[var(--text-sidebar-active)] text-base whitespace-nowrap tracking-tight">
                    EduCRM
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Navigation groups ──────────────────────────────────────── */}
          <nav
            aria-label={tCommon('mainNavigation')}
            className={cn(
              'flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-4',
              collapsed ? 'px-2' : 'px-2.5',
            )}
            style={{ scrollbarWidth: 'none' }}
          >
            {groups.map((group) => (
              <NavGroupComponent
                key={group.key}
                group={group}
                collapsed={collapsed}
                pathname={pathname}
              />
            ))}
          </nav>

          {/* ── User section at bottom ─────────────────────────────────── */}
          <div className="border-t border-white/5 p-2 shrink-0">
            {user ? (
              collapsed ? (
                // Collapsed: avatar only with tooltip
                <div className="flex justify-center">
                  <Tooltip.Root delayDuration={300}>
                    <Tooltip.Trigger asChild>
                      <Link
                        href={`/${locale}/${role}/profile`}
                        aria-label={`${user.firstName} ${user.lastName} — ${tCommon('viewProfile')}`}
                        className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                      >
                        <AvatarWithRole user={user} size="sm" />
                      </Link>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        side="right"
                        sideOffset={10}
                        className="z-50 rounded-lg px-2.5 py-2 text-xs shadow-lg bg-[var(--bg-surface)] border border-[var(--border-default)]"
                      >
                        <p className="font-semibold text-[var(--text-primary)]">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-[var(--text-muted)] capitalize">{role}</p>
                        <Tooltip.Arrow className="fill-[var(--bg-surface)]" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </div>
              ) : (
                // Expanded: full user info + logout button
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 0.12 } }}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[var(--bg-sidebar-item-hover)] transition-colors group"
                >
                  <Link
                    href={`/${locale}/${role}/profile`}
                    className="flex items-center gap-2 flex-1 min-w-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded-lg"
                    aria-label={tCommon('viewProfile')}
                  >
                    <AvatarWithRole user={user} size="sm" showRole />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-sidebar-active)] truncate leading-tight">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[10px] text-[var(--text-sidebar)] capitalize mt-0.5">
                        {role}
                      </p>
                    </div>
                  </Link>

                  {/* Logout button */}
                  <Tooltip.Root delayDuration={300}>
                    <Tooltip.Trigger asChild>
                      <motion.button
                        onClick={logout}
                        aria-label={tCommon('logout')}
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                          'p-1.5 rounded-lg shrink-0',
                          'text-[var(--text-sidebar)] opacity-0 group-hover:opacity-100',
                          'hover:text-[var(--error-solid)] hover:bg-[var(--error-bg)]',
                          'transition-all duration-150',
                          'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                          'focus-visible:opacity-100',
                        )}
                      >
                        <LogOut size={14} aria-hidden="true" />
                      </motion.button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        side="top"
                        sideOffset={6}
                        className="z-50 rounded-lg px-2.5 py-1.5 text-xs font-medium shadow-lg bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)] animate-in fade-in-0 zoom-in-95"
                      >
                        {tCommon('logout')}
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </motion.div>
              )
            ) : (
              // Loading skeleton for user section
              <div
                className={cn(
                  'rounded-xl',
                  collapsed
                    ? 'w-9 h-9 mx-auto'
                    : 'h-11 w-full',
                  'bg-white/5 animate-pulse',
                )}
                aria-hidden="true"
              />
            )}
          </div>
        </motion.aside>
      </div>
    </Tooltip.Provider>
  );
}
