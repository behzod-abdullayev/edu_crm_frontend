'use client';
// src/app/[locale]/(dashboard)/owner/dashboard/OwnerDashboardClient.tsx
//
// ✅ XATO 2 FIXED:  WebSocket invalidation now uses queryKeys.owner.dashboard()
// ✅ XATO 5 FIXED:  BranchRow status text uses i18n (t('statusActive') / t('statusInactive'))
// ✅ XATO 13 FIXED: Greeting uses user?.firstName from useAuthStore
// ✅ Hooks imported from @/modules/owner/hooks/useOwner (TanStack Query)

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';

import {
  useOwnerKPI,
  useOwnerBranches,
  useOwnerAnalytics,
} from '@/modules/owner/hooks/useOwner';
import { GlobalKPIDashboard } from '@/modules/owner/components/GlobalKPIDashboard';
import { useToast } from '@/shared/hooks/useToast';
import { useAuthStore } from '@/store/auth.store';

import { SocketEvent } from '@/services/websocket/socket.events';
import { useSocketEvent } from '@/shared/hooks/useWebSocket';
import { queryKeys } from '@/services/query/keys.factory';
import { cn } from '@/shared/utils/cn';

// ─── Lazy-loaded heavy charts ─────────────────────────────────────────────────

const MultiTenantAnalytics = dynamic(
  () =>
    import('@/modules/owner/components/MultiTenantAnalytics').then(
      (m) => m.MultiTenantAnalytics,
    ),
  { ssr: false },
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreetingKey(): 'greetingMorning' | 'greetingAfternoon' | 'greetingEvening' {
  const h = new Date().getHours();
  if (h < 12) return 'greetingMorning';
  if (h < 17) return 'greetingAfternoon';
  return 'greetingEvening';
}

// ─── Quick-stat card ─────────────────────────────────────────────────────────

interface QuickStatProps {
  label: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  colorToken: string;
  vsLastMonth: string;
}

function QuickStat({ label, value, change, icon, colorToken, vsLastMonth }: QuickStatProps) {
  const isPos = change >= 0;
  return (
    <motion.div
      className="rounded-2xl border p-5 flex gap-4 items-center"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: colorToken + '18', color: colorToken }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-xs font-semibold uppercase tracking-wider truncate"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </p>
        <p
          className="text-2xl font-black tabular-nums tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </p>
        <span
          className={cn(
            'inline-flex items-center gap-0.5 text-xs font-semibold',
            isPos ? 'text-[var(--success-text)]' : 'text-[var(--error-text)]',
          )}
          role="status"
          aria-label={`${change}% ${vsLastMonth}`}
        >
          <span aria-hidden="true">{isPos ? '↑' : '↓'}</span>
          {Math.abs(change)}%{' '}
          <span className="font-normal opacity-70">{vsLastMonth}</span>
        </span>
      </div>
    </motion.div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      aria-label={title}
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-base font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h2>
        {action}
      </div>
      {children}
    </motion.section>
  );
}

// ─── Top branches quick list ───────────────────────────────────────────────────

interface BranchRowProps {
  name: string;
  students: number;
  revenue: string;
  status: 'active' | 'inactive';
  index: number;
  studentLabel: string;
  // ✅ XATO 5 FIX: Accept translated status label instead of raw backend value
  statusLabel: string;
}

function BranchRow({ name, students, revenue, status, index, studentLabel, statusLabel }: BranchRowProps) {
  return (
    <motion.div
      className="flex items-center gap-3 py-3 border-b last:border-b-0"
      style={{ borderColor: 'var(--border-default)' }}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{
          background: 'var(--brand-primary)',
          color: 'var(--text-on-brand)',
        }}
        aria-hidden="true"
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {name}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {students} {studentLabel}
        </p>
      </div>
      <div className="text-right">
        <p
          className="text-sm font-semibold tabular-nums"
          style={{ color: 'var(--text-primary)' }}
        >
          {revenue}
        </p>
        {/* ✅ XATO 5 FIX: statusLabel is already translated, never shows raw "active"/"inactive" */}
        <span
          className="text-xs font-medium rounded-full px-2 py-0.5"
          style={{
            background:
              status === 'active'
                ? 'var(--success-bg)'
                : 'var(--error-bg)',
            color:
              status === 'active'
                ? 'var(--success-text)'
                : 'var(--error-text)',
          }}
          role="status"
          aria-label={statusLabel}
        >
          {statusLabel}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export function OwnerDashboardClient() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const t = useTranslations('owner.dashboard');
  const locale = useLocale();

  // ✅ XATO 13 FIX: Get user from auth store to show real name in greeting
  const { user } = useAuthStore();

  const { data: kpi, isLoading: kpiLoading } = useOwnerKPI();
  const { branches, isLoading: branchesLoading } = useOwnerBranches();
  const { chartData, isLoading: chartsLoading } = useOwnerAnalytics();

  // ── Real-time WebSocket events ───────────────────────────────────────────
  // ✅ XATO 2 FIX: Use queryKeys.owner.dashboard() — not ['owner', 'kpi']
  useSocketEvent(SocketEvent.PAYMENT_RECEIVED, () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.owner.dashboard() });
    toast.success(t('newPayment') as string);
  });

  useSocketEvent(SocketEvent.NOTIFICATION_NEW, () => {
    void queryClient.invalidateQueries({
      queryKey: ['notifications'],
    });
  });

  // ── Branch names for chart legend ────────────────────────────────────────
  const branchNames = useMemo(
    () => branches.map((b) => b.name),
    [branches],
  );

  // ── Localised date ────────────────────────────────────────────────────────
  const dateLabel = new Date().toLocaleDateString(
    locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    },
  );

  // ── Quick stats from KPI ─────────────────────────────────────────────────
  const vsLastMonth = t('vsLastMonth');
  const quickStats: QuickStatProps[] = kpi
    ? [
        {
          label: t('mrr_short'),
          value: `${(kpi.mrr / 1_000_000).toFixed(1)}M UZS`,
          change: kpi.trends?.mrrChange ?? 0,
          icon: '💰',
          colorToken: 'var(--brand-primary)',
          vsLastMonth,
        },
        {
          label: t('totalUsers_short'),
          value: kpi.totalUsers.toLocaleString(),
          change: kpi.trends?.usersChange ?? 0,
          icon: '👥',
          colorToken: 'var(--brand-secondary)',
          vsLastMonth,
        },
        {
          label: t('branches_short'),
          value: String(kpi.totalBranches),
          change: 0,
          icon: '🏢',
          colorToken: 'var(--brand-accent)',
          vsLastMonth,
        },
        {
          label: t('enrollments_short'),
          value: kpi.monthlyEnrollments.toLocaleString(),
          change: kpi.trends?.enrollmentsChange ?? 0,
          icon: '📚',
          colorToken: 'var(--role-teacher)',
          vsLastMonth,
        },
      ]
    : [];

  return (
    <div
      className="space-y-10 pb-8"
      style={{ padding: 'var(--space-6)' }}
    >
      {/* ── Page heading ───────────────────────────────────────────────── */}
      <motion.div
        className="space-y-1"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1
          className="text-2xl font-bold sm:text-3xl"
          style={{ color: 'var(--text-primary)' }}
        >
          {/* ✅ XATO 13 FIX: Show real user name, fallback to t('owner') */}
          {t(getGreetingKey())}, {user?.firstName ?? t('owner')} 👋
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {dateLabel}
        </p>
      </motion.div>

      {/* ── Global KPI cards ───────────────────────────────────────────── */}
      <Section title={t('keyMetrics')}>
        {kpiLoading ? (
          // ✅ XATO 7 FIX: grid-cols-1 on mobile (not grid-cols-2)
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-3 xl:grid-cols-6"
            aria-busy="true"
            aria-label={t('ariaMetrics')}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-2xl animate-pulse"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
            ))}
          </div>
        ) : kpi ? (
          <GlobalKPIDashboard data={kpi} />
        ) : (
          <p
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('noKpiData')}
          </p>
        )}
      </Section>

      {/* ── Quick stats row (mobile-friendly) ─────────────────────────── */}
      {!kpiLoading && kpi && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {quickStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
            >
              <QuickStat {...stat} />
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Analytics charts ───────────────────────────────────────────── */}
      <Section title={t('platformAnalytics')}>
        {chartsLoading ? (
          <div
            className="grid gap-4 lg:grid-cols-2"
            aria-busy="true"
            aria-label={t('platformAnalytics')}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 rounded-xl animate-pulse"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
            ))}
          </div>
        ) : chartData ? (
          <MultiTenantAnalytics
            data={chartData}
            branches={branchNames}
            isFullPage={false}
          />
        ) : (
          <div
            className="rounded-xl border p-12 text-center"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-muted)',
            }}
          >
            <p className="text-sm">{t('noAnalyticsData')}</p>
          </div>
        )}
      </Section>

      {/* ── Branch overview ────────────────────────────────────────────── */}
      <Section
        title={t('branchesOverview')}
        action={
          <motion.a
            href="branches"
            className="text-sm font-medium underline-offset-4 hover:underline"
            style={{ color: 'var(--brand-primary)' }}
            whileTap={{ scale: 0.97 }}
          >
            {t('viewAll')} →
          </motion.a>
        }
      >
        <div
          className="rounded-xl border p-4"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
          }}
        >
          {branchesLoading ? (
            <div
              className="space-y-3"
              aria-busy="true"
              aria-label={t('branchesOverview')}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg animate-pulse"
                  style={{ background: 'var(--bg-surface-hover)' }}
                />
              ))}
            </div>
          ) : branches.length === 0 ? (
            <p
              className="py-8 text-center text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              {t('noBranchesYet')}
            </p>
          ) : (
            <div>
              {branches.slice(0, 5).map((b, i) => (
                <BranchRow
                  key={b.id}
                  name={b.name}
                  students={b.studentCount}
                  revenue={`${b.monthlyRevenue.toLocaleString()} ${b.currency}`}
                  status={b.status}
                  index={i}
                  studentLabel={t('studentLabel')}
                  // ✅ XATO 5 FIX: Pass translated status label
                  statusLabel={b.status === 'active' ? t('statusActive') : t('statusInactive')}
                />
              ))}
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
