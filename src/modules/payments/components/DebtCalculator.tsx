'use client';

// ✅ FIX 1: `differenceInDays` and `format` were imported but NEVER used.
// With the project's ESLint config (@typescript-eslint/no-unused-vars), unused
// imports produce lint errors.  They have been removed entirely.
//
// ✅ FIX 2: `DebtSummary` is used only as a type.  Use `import type` to make
// the intent explicit and satisfy any future `verbatimModuleSyntax` upgrade.

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Bell } from 'lucide-react';
import type { DebtSummary } from '../types/payment.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DebtCalculatorProps {
  debts: DebtSummary[];
  onSendReminder?: (studentId: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysOverdueLabel(days: number): string {
  if (days <= 0) return 'Not overdue';
  if (days === 1) return '1 day overdue';
  return `${days} days overdue`;
}

type OverdueSeverity = 'none' | 'mild' | 'moderate' | 'severe';

function getOverdueSeverity(days: number): OverdueSeverity {
  if (days <= 0) return 'none';
  if (days <= 7) return 'mild';
  if (days <= 30) return 'moderate';
  return 'severe';
}

// Uses CSS custom properties defined in globals.css so the colours respect
// both light and dark modes without Tailwind dark: variants.
const SEVERITY_CLASSES: Record<OverdueSeverity, string> = {
  none: 'text-[var(--text-muted)]',
  mild: 'text-[var(--warning-text)]',
  moderate: 'text-[var(--warning-solid)]',
  severe: 'text-[var(--error-text)] font-semibold',
};

// ─── Animation variants ───────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.04 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function DebtCalculator({ debts, onSendReminder }: DebtCalculatorProps) {
  const totalOwed = debts.reduce((sum, d) => sum + d.totalOwed, 0);
  const totalOverdue = debts.reduce((sum, d) => sum + d.overdueAmount, 0);
  const overdueDebts = debts.filter((d) => d.daysOverdue > 0);
  const overdueCount = overdueDebts.length;
  const avgDaysOverdue =
    overdueCount > 0
      ? Math.round(overdueDebts.reduce((s, d) => s + d.daysOverdue, 0) / overdueCount)
      : 0;

  // Currency from the first debt (all debts share the same currency per tenant).
  const currency = debts[0]?.currency ?? 'UZS';

  const summaryStats = [
    {
      label: 'Total Owed',
      value: `${totalOwed.toLocaleString()} ${currency}`,
      highlight: false,
    },
    {
      label: 'Total Overdue',
      value: `${totalOverdue.toLocaleString()} ${currency}`,
      highlight: true,
    },
    {
      label: 'Students Overdue',
      value: String(overdueCount),
      highlight: overdueCount > 0,
    },
    {
      label: 'Avg Days Overdue',
      value: `${avgDaysOverdue}d`,
      highlight: false,
    },
  ] satisfies ReadonlyArray<{ label: string; value: string; highlight: boolean }>;

  return (
    <motion.div
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ── Card header ── */}
      <div className="border-b border-[var(--border-default)] px-6 py-4 flex items-center gap-3">
        {overdueCount > 0 && (
          <AlertTriangle
            className="w-4 h-4 text-[var(--warning-solid)] shrink-0"
            aria-hidden="true"
          />
        )}
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Debt Summary
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            {overdueCount === 0
              ? 'No overdue payments'
              : `${overdueCount} student${overdueCount !== 1 ? 's' : ''} with overdue payments`}
          </p>
        </div>
      </div>

      {/* ── Summary stats grid ── */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 border-b border-[var(--border-default)]"
        role="list"
        aria-label="Debt statistics"
      >
        {summaryStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            role="listitem"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.2 }}
            className="px-4 py-3 border-r border-b border-[var(--border-default)] last:border-r-0 sm:border-b-0 [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r"
          >
            <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
            <p
              className={[
                'mt-0.5 text-xl font-bold tabular-nums',
                stat.highlight
                  ? 'text-[var(--error-text)]'
                  : 'text-[var(--text-primary)]',
              ].join(' ')}
            >
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── Per-student debt rows ── */}
      <AnimatePresence mode="wait">
        {debts.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-6 py-10 text-center text-sm text-[var(--text-muted)]"
            role="status"
          >
            No outstanding debts
          </motion.div>
        ) : (
          <motion.div
            key="list"
            role="list"
            aria-label="Student debts"
            className="divide-y divide-[var(--border-default)]"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            {debts.map((debt) => {
              const severity = getOverdueSeverity(debt.daysOverdue);
              return (
                <motion.div
                  key={debt.studentId}
                  role="listitem"
                  variants={rowVariants}
                  whileHover={{
                    backgroundColor: 'var(--bg-surface-hover)',
                  }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-between gap-4 px-6 py-3 min-h-[44px]"
                >
                  {/* Name + overdue label */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                      {debt.studentName}
                    </p>
                    <p className={`text-xs ${SEVERITY_CLASSES[severity]}`}>
                      {getDaysOverdueLabel(debt.daysOverdue)}
                    </p>
                  </div>

                  {/* Amount column */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums text-[var(--text-primary)]">
                      {debt.totalOwed.toLocaleString()} {debt.currency}
                    </p>
                    {debt.overdueAmount > 0 && (
                      <p className="text-xs font-medium text-[var(--error-text)] tabular-nums">
                        {debt.overdueAmount.toLocaleString()} overdue
                      </p>
                    )}
                  </div>

                  {/* Remind button — only when handler provided and debt is overdue */}
                  {onSendReminder && debt.daysOverdue > 0 && (
                    <motion.button
                      type="button"
                      onClick={() => onSendReminder(debt.studentId)}
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.15 }}
                      aria-label={`Send payment reminder to ${debt.studentName}`}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] min-h-[32px]"
                    >
                      <Bell className="w-3 h-3" aria-hidden="true" />
                      Remind
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}