'use client';

// src/modules/admin/components/AdminDashboardClient.tsx
// ✅ FIX: Error state only shows when isLoading=false AND error is not null
//         Previously showed error when data===null (which is also the initial state)

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useAdminDashboard } from '../hooks/useAdmin';
import { OperationalDashboard } from './OperationalDashboard';
import { AdminDashboardSkeleton } from './AdminDashboardSkeleton';

// ─── Page transition variants ─────────────────────────────────────────────────

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// ─── AdminDashboardClient ─────────────────────────────────────────────────────

export function AdminDashboardClient() {
  const t = useTranslations('admin.dashboard');
  const locale = useLocale();
  const router = useRouter();

  // ✅ FIX: useAdminDashboard now returns { data, isLoading, error, refresh }
  const { data, isLoading, error, refresh } = useAdminDashboard();

  const handleNavigate = useCallback(
    (path: string) => {
      router.push(`/${locale}${path}`);
    },
    [router, locale],
  );

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  // ── Error state ──────────────────────────────────────────────────────────
  // ✅ FIX: Only show error state when isLoading=false AND error is not null
  //         Previously: `if (error !== null || data === null)` would show error
  //         even when data hasn't loaded yet (data===null is the initial state)
  if (error !== null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center"
        role="alert"
        aria-live="assertive"
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--error-bg)] border border-[var(--error-border)]"
          aria-hidden="true"
        >
          <span className="text-2xl">⚠️</span>
        </div>
        <div>
          <p className="text-base font-semibold text-[var(--text-primary)]">
            Failed to load dashboard
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)] max-w-sm">
            {error}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => void refresh()}
          className="mt-2 flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-5 py-2.5
            text-sm font-medium text-[var(--text-on-brand)]
            hover:bg-[var(--brand-primary-hover)] transition-colors
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2"
          type="button"
        >
          <RefreshCw size={14} aria-hidden="true" />
          Retry
        </motion.button>
      </motion.div>
    );
  }

  // ── Empty / no data state ─────────────────────────────────────────────────
  // ✅ FIX: data can be null if backend returned no content — show friendly message
  if (data === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center"
      >
        <div className="h-16 w-16 rounded-2xl bg-[var(--bg-surface-secondary)] flex items-center justify-center text-2xl">
          📊
        </div>
        <p className="text-base font-semibold text-[var(--text-primary)]">
          No dashboard data yet
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Dashboard data will appear here once the backend is connected.
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => void refresh()}
          className="mt-1 flex items-center gap-2 rounded-lg border border-[var(--border-default)]
            px-4 py-2 text-sm font-medium text-[var(--text-secondary)]
            hover:bg-[var(--bg-surface-hover)] transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          type="button"
        >
          <RefreshCw size={14} aria-hidden="true" />
          Refresh
        </motion.button>
      </motion.div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            Overview of your academy&apos;s performance
          </p>
        </div>

        {/* Quick export button */}
        <motion.button
          whileHover={{ y: -1, boxShadow: 'var(--shadow-md)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleNavigate('/admin/reports')}
          className="flex min-h-[44px] items-center gap-2 rounded-lg
            border border-[var(--border-default)] bg-[var(--bg-surface)]
            px-4 py-2.5 text-sm font-medium text-[var(--text-primary)]
            transition-colors hover:bg-[var(--bg-surface-hover)]
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2"
          type="button"
          aria-label="View reports"
        >
          <span aria-hidden="true">📊</span>
          <span className="hidden sm:inline">View Reports</span>
        </motion.button>
      </div>

      {/* ── Main dashboard ───────────────────────────────────────────────── */}
      <OperationalDashboard data={data} onNavigate={handleNavigate} />
    </motion.div>
  );
}
