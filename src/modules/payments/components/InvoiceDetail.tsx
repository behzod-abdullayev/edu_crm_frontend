'use client';

import { InvoiceDto } from '../types/payment.types';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { MultiCurrencyDisplay } from './MultiCurrencyDisplay';
import { format } from 'date-fns';

interface InvoiceDetailProps {
  invoice: InvoiceDto;
  canRefund: boolean;
  onMarkPaid: () => void;
  onSendReminder: () => void;
  onRefund: () => void;
}

export function InvoiceDetail({
  invoice,
  canRefund,
  onMarkPaid,
  onSendReminder,
  onRefund,
}: InvoiceDetailProps) {
  const netAmount = invoice.amount - (invoice.amount * (invoice.discount / 100));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-6">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <h2 className="text-xl font-bold text-foreground">
              Invoice #{invoice.id.slice(0, 8).toUpperCase()}
            </h2>
            <PaymentStatusBadge status={invoice.status} size="lg" />
          </div>
          <p className="text-sm text-muted-foreground">
            Created {format(new Date(invoice.createdAt), 'dd MMM yyyy')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {invoice.status === 'pending' && (
            <button
              onClick={onMarkPaid}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              type="button"
            >
              Mark as Paid
            </button>
          )}
          {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <button
              onClick={onSendReminder}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              type="button"
            >
              Send Reminder
            </button>
          )}
          {canRefund && invoice.status === 'paid' && (
            <button
              onClick={onRefund}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              type="button"
            >
              Refund
            </button>
          )}
        </div>
      </div>

      {/* Student + Course info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Student
          </h3>
          <p className="font-medium text-foreground">{invoice.studentName}</p>
          <p className="text-sm text-muted-foreground">{invoice.studentEmail}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Course
          </h3>
          <p className="font-medium text-foreground">{invoice.courseName}</p>
          {invoice.description && (
            <p className="text-sm text-muted-foreground">{invoice.description}</p>
          )}
        </div>
      </div>

      {/* Amount breakdown */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Amount
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <MultiCurrencyDisplay amount={invoice.amount} currency={invoice.currency} showOriginal={false} />
          </div>
          {invoice.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
              <span>Discount ({invoice.discount}%)</span>
              <span>−{(invoice.amount * invoice.discount / 100).toLocaleString()} {invoice.currency}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 font-semibold">
            <span>Total</span>
            <MultiCurrencyDisplay amount={netAmount} currency={invoice.currency} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
          <div>
            <p className="text-muted-foreground">Due Date</p>
            <p className="font-medium">{format(new Date(invoice.dueDate), 'dd MMM yyyy')}</p>
          </div>
          {invoice.paidAt && (
            <div>
              <p className="text-muted-foreground">Paid At</p>
              <p className="font-medium">{format(new Date(invoice.paidAt), 'dd MMM yyyy HH:mm')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment history timeline */}
      {invoice.history.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            History
          </h3>
          <ol className="relative space-y-4 border-l border-border pl-6">
            {invoice.history.map((entry, index) => (
              <li key={entry.id} className="relative">
                <span className="absolute -left-[1.4375rem] flex h-4 w-4 items-center justify-center rounded-full border border-border bg-card">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                <p className="text-sm font-medium text-foreground">{entry.action}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.performedBy} · {format(new Date(entry.performedAt), 'dd MMM yyyy HH:mm')}
                </p>
                {entry.note && (
                  <p className="mt-1 text-xs text-muted-foreground">{entry.note}</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
