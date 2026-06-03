'use client';

import { differenceInDays, format } from 'date-fns';
import { DebtSummary } from '../types/payment.types';

interface DebtCalculatorProps {
  debts: DebtSummary[];
  onSendReminder?: (studentId: string) => void;
}

function getDaysOverdueLabel(days: number): string {
  if (days <= 0) return 'Not overdue';
  if (days === 1) return '1 day overdue';
  return `${days} days overdue`;
}

function getOverdueSeverity(days: number): 'none' | 'mild' | 'moderate' | 'severe' {
  if (days <= 0) return 'none';
  if (days <= 7) return 'mild';
  if (days <= 30) return 'moderate';
  return 'severe';
}

const SEVERITY_CLASSES: Record<ReturnType<typeof getOverdueSeverity>, string> = {
  none: 'text-muted-foreground',
  mild: 'text-yellow-600 dark:text-yellow-400',
  moderate: 'text-orange-600 dark:text-orange-400',
  severe: 'text-red-600 dark:text-red-400 font-semibold',
};

export function DebtCalculator({ debts, onSendReminder }: DebtCalculatorProps) {
  const totalOwed = debts.reduce((sum, d) => sum + d.totalOwed, 0);
  const totalOverdue = debts.reduce((sum, d) => sum + d.overdueAmount, 0);
  const overdueCount = debts.filter((d) => d.daysOverdue > 0).length;

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h3 className="text-base font-semibold text-foreground">Debt Summary</h3>
        <p className="text-sm text-muted-foreground">
          {overdueCount} student{overdueCount !== 1 ? 's' : ''} with overdue payments
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px border-b border-border bg-border sm:grid-cols-4">
        {[
          { label: 'Total Owed', value: totalOwed, highlight: false },
          { label: 'Total Overdue', value: totalOverdue, highlight: true },
          { label: 'Students Overdue', value: overdueCount, highlight: overdueCount > 0, isCount: true },
          {
            label: 'Avg Days Overdue',
            value:
              overdueCount > 0
                ? Math.round(debts.filter((d) => d.daysOverdue > 0).reduce((s, d) => s + d.daysOverdue, 0) / overdueCount)
                : 0,
            highlight: false,
            isCount: true,
            suffix: 'd',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p
              className={[
                'mt-0.5 text-xl font-bold tabular-nums',
                stat.highlight ? 'text-red-600 dark:text-red-400' : 'text-foreground',
              ].join(' ')}
            >
              {stat.isCount
                ? `${stat.value}${stat.suffix ?? ''}`
                : `${stat.value.toLocaleString()} ${debts[0]?.currency ?? 'UZS'}`}
            </p>
          </div>
        ))}
      </div>

      <div className="divide-y divide-border">
        {debts.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No outstanding debts
          </div>
        ) : (
          debts.map((debt) => {
            const severity = getOverdueSeverity(debt.daysOverdue);
            return (
              <div
                key={debt.studentId}
                className="flex items-center justify-between gap-4 px-6 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {debt.studentName}
                  </p>
                  <p className={['text-xs', SEVERITY_CLASSES[severity]].join(' ')}>
                    {getDaysOverdueLabel(debt.daysOverdue)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-foreground">
                    {debt.totalOwed.toLocaleString()} {debt.currency}
                  </p>
                  {debt.overdueAmount > 0 && (
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 tabular-nums">
                      {debt.overdueAmount.toLocaleString()} overdue
                    </p>
                  )}
                </div>

                {onSendReminder && debt.daysOverdue > 0 && (
                  <button
                    onClick={() => onSendReminder(debt.studentId)}
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    type="button"
                  >
                    Remind
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
