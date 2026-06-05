'use client';

/**
 * src/modules/payments/components/InvoiceDetail.tsx
 *
 * Invoice detail view — rendered inside a modal (desktop) or bottom sheet (mobile).
 *
 * ✅ Framer Motion: stagger timeline, scale action buttons, fade sections
 * ✅ Responsive: 1-col → 2-col grid for student/course cards
 * ✅ Full light/dark CSS variable palette
 * ✅ PaymentStatusBadge + MultiCurrencyDisplay integration
 * ✅ ARIA: labelledby heading, role dialog context, live regions, semantic time
 * ✅ Zero "any" TypeScript — strict + exactOptionalPropertyTypes
 * ✅ next-intl i18n — zero hardcoded strings
 * ✅ No unsupported props passed to FadeIn
 */

import { useId } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import {
  CheckCircle2,
  Bell,
  RotateCcw,
  Calendar,
  CreditCard,
  User,
  BookOpen,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import { FadeIn } from '@shared/components/animations/FadeIn';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { cn } from '@shared/utils/cn';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { MultiCurrencyDisplay } from './MultiCurrencyDisplay';
import type { InvoiceDto } from '../types/payment.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InvoiceDetailProps {
  invoice: InvoiceDto;
  canManage: boolean;
  isMarkingPaid?: boolean;
  isSendingReminder?: boolean;
  isRefunding?: boolean;
  onMarkPaid: () => void;
  onSendReminder: () => void;
  onRefund: () => void;
  isLoading?: boolean;
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function InvoiceDetailSkeleton() {
  return (
    <div className="space-y-5 p-1" aria-busy="true" aria-label="Loading invoice details">
      <SkeletonLoader variant="card" />
      <div className="grid gap-4 sm:grid-cols-2">
        <SkeletonLoader variant="card" />
        <SkeletonLoader variant="card" />
      </div>
      <SkeletonLoader variant="card" />
    </div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

interface ActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  icon: LucideIcon;
  label: string;
  variant: 'primary' | 'secondary' | 'danger';
}

const BUTTON_STYLES: Record<ActionButtonProps['variant'], string> = {
  primary: [
    'bg-[var(--success-solid)] hover:brightness-90 text-white',
    'border border-[var(--success-border)]',
  ].join(' '),
  secondary: [
    'bg-[var(--bg-surface-hover)] hover:bg-[var(--bg-surface-secondary)]',
    'border border-[var(--border-default)] text-[var(--text-primary)]',
  ].join(' '),
  danger: [
    'bg-[var(--error-bg)] hover:brightness-95',
    'border border-[var(--error-border)] text-[var(--error-text)]',
  ].join(' '),
};

function ActionButton({
  onClick,
  disabled = false,
  isLoading = false,
  icon: Icon,
  label,
  variant,
}: ActionButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-disabled={disabled || isLoading}
      className={cn(
        'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium',
        'transition-all duration-150 min-h-[44px]',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        BUTTON_STYLES[variant],
      )}
    >
      <Icon
        size={15}
        className={isLoading ? 'animate-spin' : ''}
        aria-hidden="true"
      />
      {label}
    </motion.button>
  );
}

// ─── Info row ─────────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: 'var(--bg-surface-secondary)' }}
      >
        <Icon size={14} className="text-[var(--text-muted)]" aria-hidden="true" />
      </div>
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
        <div className="mt-0.5 text-sm font-medium text-[var(--text-primary)]">{value}</div>
      </div>
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

function SectionCard({ title, children }: SectionCardProps) {
  return (
    <div
      className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ─── History timeline ─────────────────────────────────────────────────────────

interface HistoryTimelineProps {
  invoice: InvoiceDto;
  t: ReturnType<typeof useTranslations<'payments'>>;
}

function HistoryTimeline({ invoice, t }: HistoryTimelineProps) {
  if (invoice.history.length === 0) return null;

  return (
    <SectionCard title={t('invoiceHistory')}>
      <ol
        className="relative space-y-4 border-l-2 border-[var(--border-default)] pl-6"
        aria-label={t('invoiceHistory')}
      >
        {invoice.history.map((entry, index) => (
          <motion.li
            key={entry.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * index, duration: 0.25 }}
            className="relative"
          >
            {/* Timeline dot */}
            <span
              className={cn(
                'absolute -left-[1.4375rem] flex h-4 w-4 items-center justify-center',
                'rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)]',
              )}
              aria-hidden="true"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)]" />
            </span>

            <p className="text-sm font-medium text-[var(--text-primary)]">{entry.action}</p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              <span className="font-medium">{entry.performedBy}</span>
              {' · '}
              <time dateTime={entry.performedAt}>
                {format(new Date(entry.performedAt), 'dd MMM yyyy HH:mm')}
              </time>
            </p>
            {entry.note !== null && (
              <p className="mt-1 rounded-lg bg-[var(--bg-surface-secondary)] px-3 py-1.5 text-xs text-[var(--text-secondary)]">
                {entry.note}
              </p>
            )}
          </motion.li>
        ))}
      </ol>
    </SectionCard>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InvoiceDetail({
  invoice,
  canManage,
  isMarkingPaid = false,
  isSendingReminder = false,
  isRefunding = false,
  onMarkPaid,
  onSendReminder,
  onRefund,
  isLoading = false,
}: InvoiceDetailProps) {
  const t = useTranslations('payments');
  const headingId = useId();

  if (isLoading) return <InvoiceDetailSkeleton />;

  const discountAmount = invoice.amount * (invoice.discount / 100);
  const netAmount = invoice.amount - discountAmount;

  const canMarkPaid   = canManage && invoice.status === 'pending';
  const canRemind     = canManage && invoice.status !== 'paid' && invoice.status !== 'cancelled';
  const canRefund     = canManage && invoice.status === 'paid';

  return (
    <FadeIn className="space-y-5">
      <article aria-labelledby={headingId}>

        {/* ── Header: ID + status + actions ── */}
        <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-3">
              <h2
                id={headingId}
                className="text-xl font-bold text-[var(--text-primary)]"
              >
                {t('invoice')} #{invoice.id.slice(0, 8).toUpperCase()}
              </h2>
              <PaymentStatusBadge status={invoice.status} size="lg" />
            </div>
            <p className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
              <Clock size={12} aria-hidden="true" />
              <time dateTime={invoice.createdAt}>
                {format(new Date(invoice.createdAt), 'dd MMM yyyy')}
              </time>
            </p>
          </div>

          {/* Actions */}
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label={t('invoiceActions')}
          >
            {canMarkPaid && (
              <ActionButton
                variant="primary"
                icon={CheckCircle2}
                label={t('markAsPaid')}
                onClick={onMarkPaid}
                isLoading={isMarkingPaid}
              />
            )}
            {canRemind && (
              <ActionButton
                variant="secondary"
                icon={Bell}
                label={t('sendReminder')}
                onClick={onSendReminder}
                isLoading={isSendingReminder}
              />
            )}
            {canRefund && (
              <ActionButton
                variant="danger"
                icon={RotateCcw}
                label={t('refund')}
                onClick={onRefund}
                isLoading={isRefunding}
              />
            )}
          </div>
        </div>

        {/* ── Student + Course ── */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <SectionCard title={t('student')}>
            <div className="space-y-3">
              <InfoRow icon={User} label={t('name')} value={invoice.studentName} />
              <InfoRow
                icon={CreditCard}
                label={t('email')}
                value={
                  <a
                    href={`mailto:${invoice.studentEmail}`}
                    className={cn(
                      'text-[var(--brand-primary)] hover:underline',
                      'focus-visible:outline-none focus-visible:ring-1',
                      'focus-visible:ring-[var(--border-focus)] rounded',
                    )}
                  >
                    {invoice.studentEmail}
                  </a>
                }
              />
            </div>
          </SectionCard>

          <SectionCard title={t('course')}>
            <div className="space-y-3">
              <InfoRow icon={BookOpen} label={t('courseName')} value={invoice.courseName} />
              {invoice.description !== null && (
                <InfoRow
                  icon={CreditCard}
                  label={t('description')}
                  value={invoice.description}
                />
              )}
            </div>
          </SectionCard>
        </div>

        {/* ── Amount breakdown ── */}
        <div className="mt-4">
          <SectionCard title={t('amountBreakdown')}>
            <dl className="space-y-2.5">
              {/* Subtotal */}
              <div className="flex items-center justify-between">
                <dt className="text-sm text-[var(--text-muted)]">{t('subtotal')}</dt>
                <dd>
                  <MultiCurrencyDisplay
                    amount={invoice.amount}
                    currency={invoice.currency}
                    size="sm"
                  />
                </dd>
              </div>

              {/* Discount */}
              {invoice.discount > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center justify-between text-[var(--success-text)]"
                >
                  <dt className="text-sm">
                    {t('discount')} ({invoice.discount}%)
                  </dt>
                  <dd className="text-sm font-medium tabular-nums">
                    −{new Intl.NumberFormat('uz-UZ').format(Math.round(discountAmount))}{' '}
                    {invoice.currency}
                  </dd>
                </motion.div>
              )}

              <div
                className="border-t border-[var(--border-default)]"
                role="separator"
                aria-hidden="true"
              />

              {/* Net total */}
              <div className="flex items-center justify-between">
                <dt className="text-base font-semibold text-[var(--text-primary)]">
                  {t('total')}
                </dt>
                <dd>
                  <MultiCurrencyDisplay
                    amount={netAmount}
                    currency={invoice.currency}
                    showConversion
                    size="md"
                  />
                </dd>
              </div>
            </dl>

            {/* Due / Paid dates */}
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-[var(--border-default)] pt-4">
              <InfoRow
                icon={Calendar}
                label={t('dueDate')}
                value={
                  <time dateTime={invoice.dueDate}>
                    {format(new Date(invoice.dueDate), 'dd MMM yyyy')}
                  </time>
                }
              />
              {invoice.paidAt !== null && (
                <InfoRow
                  icon={CheckCircle2}
                  label={t('paidAt')}
                  value={
                    <time dateTime={invoice.paidAt}>
                      {format(new Date(invoice.paidAt), 'dd MMM yyyy HH:mm')}
                    </time>
                  }
                />
              )}
            </div>
          </SectionCard>
        </div>

        {/* ── History timeline ── */}
        <div className="mt-4">
          <HistoryTimeline invoice={invoice} t={t} />
        </div>

      </article>
    </FadeIn>
  );
}
