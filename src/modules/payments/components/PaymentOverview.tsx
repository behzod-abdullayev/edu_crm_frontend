'use client';

import { PaymentOverviewData } from '../types/payment.types';

interface KPICardProps {
  label: string;
  value: number;
  currency: string;
  variant: 'default' | 'success' | 'warning' | 'error';
}

const VARIANT_CLASSES: Record<KPICardProps['variant'], string> = {
  default: 'border-border',
  success: 'border-green-500/30 bg-green-500/5',
  warning: 'border-yellow-500/30 bg-yellow-500/5',
  error: 'border-red-500/30 bg-red-500/5',
};

const VALUE_CLASSES: Record<KPICardProps['variant'], string> = {
  default: 'text-foreground',
  success: 'text-green-700 dark:text-green-400',
  warning: 'text-yellow-700 dark:text-yellow-400',
  error: 'text-red-700 dark:text-red-400',
};

function KPICard({ label, value, currency, variant }: KPICardProps) {
  return (
    <div
      className={[
        'rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm',
        VARIANT_CLASSES[variant],
      ].join(' ')}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={[
          'mt-2 text-2xl font-bold tabular-nums',
          VALUE_CLASSES[variant],
        ].join(' ')}
      >
        {value.toLocaleString()}
        <span className="ml-1 text-sm font-normal text-muted-foreground">
          {currency}
        </span>
      </p>
    </div>
  );
}

interface PaymentOverviewProps {
  data: PaymentOverviewData;
  isOffline?: boolean;
}

export function PaymentOverview({ data, isOffline = false }: PaymentOverviewProps) {
  return (
    <div className="space-y-4">
      {isOffline && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-700 dark:text-yellow-400">
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          Showing cached data. Last updated:{' '}
          {new Date(data.lastUpdated).toLocaleString()}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KPICard
          label="Total Revenue"
          value={data.totalRevenue}
          currency={data.currency}
          variant="success"
        />
        <KPICard
          label="Pending"
          value={data.totalPending}
          currency={data.currency}
          variant="warning"
        />
        <KPICard
          label="Overdue"
          value={data.totalOverdue}
          currency={data.currency}
          variant="error"
        />
        <KPICard
          label="Refunded"
          value={data.totalRefunded}
          currency={data.currency}
          variant="default"
        />
      </div>
    </div>
  );
}
