'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Bell,
  User,
  Users,
  ClipboardCheck,
  FileText,
  GraduationCap,
  CreditCard,
  BarChart2,
  Settings,
  TrendingUp,
  Building2,
  DollarSign,
  Shield,
} from 'lucide-react';
import { useUnreadNotificationCount } from '@/services/query/notifications.queries';
import type { UserRole } from '@/shared/types/common.types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TabConfig {
  href: string;
  icon: React.ElementType;
  label: string;
  isNotification?: boolean;
}

interface MobileBottomNavProps {
  role: UserRole;
}

// ─── Tab Configs ─────────────────────────────────────────────────────────────

const TAB_CONFIGS: Record<UserRole, TabConfig[]> = {
  student: [
    { href: '/student', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/student/courses', icon: BookOpen, label: 'Courses' },
    { href: '/student/schedule', icon: Calendar, label: 'Schedule' },
    { href: '/student/notifications', icon: Bell, label: 'Notifications', isNotification: true },
    { href: '/student/profile', icon: User, label: 'Profile' },
  ],
  teacher: [
    { href: '/teacher', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/teacher/groups', icon: Users, label: 'Groups' },
    { href: '/teacher/attendance', icon: ClipboardCheck, label: 'Attendance' },
    { href: '/teacher/homework', icon: FileText, label: 'Homework' },
    { href: '/teacher/profile', icon: User, label: 'Profile' },
  ],
  admin: [
    { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/students', icon: GraduationCap, label: 'Students' },
    { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
    { href: '/admin/reports', icon: BarChart2, label: 'Reports' },
    { href: '/admin/settings', icon: Settings, label: 'Settings' },
  ],
  owner: [
    { href: '/owner', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/owner/analytics', icon: TrendingUp, label: 'Analytics' },
    { href: '/owner/branches', icon: Building2, label: 'Branches' },
    { href: '/owner/finances', icon: DollarSign, label: 'Finances' },
    { href: '/owner/system', icon: Shield, label: 'System' },
  ],
};

// ─── Notification Count Hook ──────────────────────────────────────────────────

function useNotificationCount(): number {
  const { data } = useUnreadNotificationCount();
  return data?.count ?? 0;
}

// ─── Notification Badge ───────────────────────────────────────────────────────

interface NotificationBadgeProps {
  count: number;
}

function NotificationBadge({ count }: NotificationBadgeProps) {
  const shouldReduceMotion = useReducedMotion();
  const prevCountRef = useRef(count);

  const isNew = count > prevCountRef.current;
  useEffect(() => {
    prevCountRef.current = count;
  }, [count]);

  if (count === 0) return null;

  return (
    <motion.span
      key={count}
      initial={isNew && !shouldReduceMotion ? { scale: 0.5 } : { scale: 1 }}
      animate={{ scale: 1 }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { type: 'spring', stiffness: 600, damping: 20 }
      }
      style={{
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 16,
        height: 16,
        borderRadius: 999,
        background: 'var(--color-error-solid)',
        color: '#fff',
        fontSize: 10,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingInline: 4,
        lineHeight: 1,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      {count > 99 ? '99+' : count}
    </motion.span>
  );
}

// ─── Tab Item ─────────────────────────────────────────────────────────────────

interface TabItemProps {
  tab: TabConfig;
  isActive: boolean;
  notificationCount: number;
}

function TabItem({ tab, isActive, notificationCount }: TabItemProps) {
  const shouldReduceMotion = useReducedMotion();
  const Icon = tab.icon;

  return (
    <Link
      href={tab.href}
      aria-label={tab.label}
      aria-current={isActive ? 'page' : undefined}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        height: '100%',
        color: isActive ? 'var(--brand-primary)' : 'var(--text-muted)',
        textDecoration: 'none',
        position: 'relative',
        minWidth: 44,
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Active pill indicator */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            layoutId="mobile-tab-indicator"
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              x: '-50%',
              width: 32,
              height: 3,
              borderRadius: '0 0 4px 4px',
              background: 'var(--brand-primary)',
            }}
            initial={shouldReduceMotion ? false : { opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 400, damping: 35 }
            }
          />
        )}
      </AnimatePresence>

      {/* Icon wrapper with press animation */}
      <motion.span
        {...(shouldReduceMotion ? {} : { whileTap: { scale: 0.92 } })}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 44,
          height: 44,
        }}
      >
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} aria-hidden="true" />

        {tab.isNotification && (
          <NotificationBadge count={notificationCount} />
        )}
      </motion.span>

      {/* Label — only visible when active */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            initial={shouldReduceMotion ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15 }}
            style={{
              fontSize: 10,
              fontWeight: 600,
              lineHeight: 1,
              color: 'var(--brand-primary)',
            }}
          >
            {tab.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const tabs: TabConfig[] = TAB_CONFIGS[role] ?? TAB_CONFIGS.student;
  const notificationCount = useNotificationCount();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 sm:hidden"
      style={{
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height, 64px)',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-default)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        display: 'flex',
        alignItems: 'stretch',
        zIndex: 50,
      }}
    >
      {tabs.map((tab) => {
        // Build the locale-aware href for navigation
        const localizedHref = `/${locale}${tab.href}`;
        // Strip locale from pathname for active check
        const pathWithoutLocale = pathname.replace(new RegExp(`^/${locale}`), '') || '/';
        const isActive =
          tab.href === `/${role}`
            ? pathWithoutLocale === tab.href || pathWithoutLocale === `/${role}/`
            : pathWithoutLocale.startsWith(tab.href);

        return (
          <TabItem
            key={tab.href}
            tab={{ ...tab, href: localizedHref }}
            isActive={isActive}
            notificationCount={notificationCount}
          />
        );
      })}
    </nav>
  );
}
