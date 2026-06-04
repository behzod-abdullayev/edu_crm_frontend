'use client';

// src/modules/admin/components/AdminDashboardClient.tsx

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
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

  const { data, isLoading, error } = useAdminDashboard();

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
  if (error !== null || data === null) {
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
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--error-bg)]"
          aria-hidden="true"
        >
          <span className="text-2xl">⚠️</span>
        </div>
        <div>
          <p className="text-base font-semibold text-[var(--text-primary)]">
            Failed to load dashboard
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {error ?? 'An unexpected error occurred. Please refresh the page.'}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => window.location.reload()}
          className="
            mt-2 rounded-lg bg-[var(--brand-primary)] px-5 py-2.5
            text-sm font-medium text-[var(--text-on-brand)]
            hover:bg-[var(--brand-primary-hover)] transition-colors
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2
          "
          type="button"
        >
          Retry
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
            Overview of your academy's performance
          </p>
        </div>

        {/* Quick export button */}
        <motion.button
          whileHover={{ y: -1, boxShadow: 'var(--shadow-md)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleNavigate('/admin/reports')}
          className="
            flex min-h-[44px] items-center gap-2 rounded-lg
            border border-[var(--border-default)] bg-[var(--bg-surface)]
            px-4 py-2.5 text-sm font-medium text-[var(--text-primary)]
            transition-colors hover:bg-[var(--bg-surface-hover)]
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2
          "
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
