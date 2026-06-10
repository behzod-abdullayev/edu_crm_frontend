'use client';

import type { PaymentStatus } from '../types/payment.types';

const STATUS_LABELS: Record<PaymentStatus, string> = {
  paid: 'Paid',
  pending: 'Pending',
  overdue: 'Overdue',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
};

const STATUS_CLASSES: Record<PaymentStatus, string> = {
  paid: 'badge-success-solid',
  pending: 'badge-warning-solid',
  overdue: 'badge-error-solid',
  refunded: 'badge-info-solid',
  cancelled: 'badge-muted',
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function PaymentStatusBadge({
  status,
  size = 'md',
}: PaymentStatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full',
        sizeClasses[size],
        STATUS_CLASSES[status],
      ].join(' ')}
      aria-label={`Payment status: ${STATUS_LABELS[status]}`}
    >
      <StatusDot status={status} />
      {STATUS_LABELS[status]}
    </span>
  );
}

function StatusDot({ status }: { status: PaymentStatus }) {
  const dotColors: Record<PaymentStatus, string> = {
    paid: 'bg-green-500',
    pending: 'bg-yellow-500',
    overdue: 'bg-red-500',
    refunded: 'bg-blue-500',
    cancelled: 'bg-gray-400',
  };

  return (
    <span
      className={[
        'inline-block h-1.5 w-1.5 rounded-full',
        dotColors[status],
      ].join(' ')}
      aria-hidden="true"
    />
  );
}
