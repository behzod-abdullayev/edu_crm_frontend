'use client';
// src/app/[locale]/(dashboard)/owner/hr/OwnerHRClient.tsx
//
// ✅ Zero `any` types
// ✅ Framer Motion: stagger rows, button press, filter transitions
// ✅ Responsive: mobile card list / tablet+desktop table
// ✅ Light/dark via CSS variables only
// ✅ ARIA: table scope, aria-sort, aria-label on actions
// ✅ HRPanel + salary inline edit from owner module
// ✅ Salary stats summary cards

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { useOwnerHR, useOwnerBranches } from '@/modules/owner/hooks/useOwner';
import { HRPanel } from '@/modules/owner/components/HRPanel';

// ─── Stat badge ───────────────────────────────────────────────────────────────

interface HRStatProps {
  label: string;
  value: string | number;
  colorToken: string;
  index: number;
}

function HRStat({ label, value, colorToken, index }: HRStatProps) {
  return (
    <motion.div
      className="rounded-2xl border p-5 flex items-center gap-4"
      style={{
        background: 'var(--bg-surface)',
        borderColor: 'var(--border-default)',
      }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
    >
      <div
        className="w-3 h-12 rounded-full flex-shrink-0"
        style={{ background: colorToken }}
        aria-hidden="true"
      />
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {label}
        </p>
        <p
          className="text-2xl font-black tabular-nums"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────

export function OwnerHRClient() {
  const t = useTranslations('owner.hr');
  const { staff, isLoading, updateSalary } = useOwnerHR();
  const { branches, isLoading: branchesLoading } = useOwnerBranches();

  // ── Computed stats ────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const teachers = staff.filter((s) => s.role === 'teacher').length;
    const admins = staff.filter((s) => s.role === 'admin').length;
    const active = staff.filter((s) => s.contractStatus === 'active').length;
    const expired = staff.filter((s) => s.contractStatus === 'expired').length;
    const totalSalary = staff.reduce((acc, s) => acc + (s.salary ?? 0), 0);
    return { teachers, admins, active, expired, totalSalary };
  }, [staff]);

  // ── Branch options for HRPanel ────────────────────────────────────────────
  const branchOptions = useMemo(
    () => branches.map((b) => ({ id: b.id, name: b.name })),
    [branches],
  );

  return (
    <div
      className="space-y-8 pb-8"
      style={{ padding: 'var(--space-6)' }}
    >
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <h1
          className="text-2xl font-bold sm:text-3xl"
          style={{ color: 'var(--text-primary)' }}
        >
          {t('pageTitle')}
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          {t('pageDesc')}
        </p>
      </motion.div>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
          aria-hidden="true"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl animate-pulse"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <HRStat
            label={t('statTeachers')}
            value={stats.teachers}
            colorToken="var(--role-teacher)"
            index={0}
          />
          <HRStat
            label={t('statAdmins')}
            value={stats.admins}
            colorToken="var(--role-admin)"
            index={1}
          />
          <HRStat
            label={t('statActiveContracts')}
            value={stats.active}
            colorToken="var(--success-solid)"
            index={2}
          />
          <HRStat
            label={t('statExpired')}
            value={stats.expired}
            colorToken="var(--error-solid)"
            index={3}
          />
          <HRStat
            label={t('statPayroll')}
            value={`${(stats.totalSalary / 1_000_000).toFixed(1)}M`}
            colorToken="var(--brand-primary)"
            index={4}
          />
        </div>
      )}

      {/* ── HR Panel (filters + table/cards) ────────────────────────────── */}
      <motion.div
        className="rounded-xl border p-5"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('staffMembers')}
          </h2>
          <span
            className="text-xs"
            style={{ color: 'var(--text-muted)' }}
            role="status"
            aria-live="polite"
          >
            {t('totalCount', { count: staff.length })}
          </span>
        </div>

        {isLoading || branchesLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading staff…">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-lg animate-pulse"
                style={{ background: 'var(--bg-surface-hover)' }}
                aria-hidden="true"
              />
            ))}
          </div>
        ) : staff.length === 0 ? (
          <motion.div
            className="py-16 text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p
              className="text-4xl mb-3"
              aria-hidden="true"
            >
              👥
            </p>
            <p
              className="text-sm font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {t('emptyTitle')}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              {t('emptyDesc')}
            </p>
          </motion.div>
        ) : (
          <HRPanel
            staff={staff}
            branches={branchOptions}
            onUpdateSalary={async (staffId, salary) => { await updateSalary(staffId, salary); }}
          />
        )}
      </motion.div>

      {/* ── Contract status legend ────────────────────────────────────── */}
      <motion.div
        className="flex flex-wrap gap-4 text-xs"
        style={{ color: 'var(--text-muted)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {[
          { label: t('legendActive'), color: 'var(--success-solid)' },
          { label: t('legendExpired'), color: 'var(--error-solid)' },
          { label: t('legendPending'), color: 'var(--warning-solid)' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: item.color }}
              aria-hidden="true"
            />
            {item.label}
          </div>
        ))}
      </motion.div>
    </div>
  );
}