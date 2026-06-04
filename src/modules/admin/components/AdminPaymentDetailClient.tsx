'use client';

// src/modules/admin/components/AdminPaymentDetailClient.tsx

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { InvoiceDetail } from '@/modules/payments/components/InvoiceDetail';
import { AdminPaymentDetailSkeleton } from './AdminPaymentDetailSkeleton';
import { useToast } from '@shared/hooks/useToast';
import type { InvoiceDto } from '@/modules/payments/types/payment.types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminPaymentDetailClientProps {
  invoiceId: string;
}

// ─── Page transition ──────────────────────────────────────────────────────────

const pageVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ─── AdminPaymentDetailClient ─────────────────────────────────────────────────

export function AdminPaymentDetailClient({ invoiceId }: AdminPaymentDetailClientProps) {
  const t         = useTranslations('admin.payments');
  const locale    = useLocale();
  const router    = useRouter();
  const { toast } = useToast();

  const [invoice, setInvoice]     = useState<InvoiceDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // ── Fetch invoice ─────────────────────────────────────────────────────────

  const fetchInvoice = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/payments/invoices/${invoiceId}`);
      if (res.status === 404) {
        setError('Invoice not found');
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as InvoiceDto;
      setInvoice(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load invoice');
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    void fetchInvoice();
  }, [fetchInvoice]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleMarkPaid = useCallback(async () => {
    if (invoice === null) return;
    try {
      const res = await fetch(`/api/admin/payments/invoices/${invoice.id}/mark-paid`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Request failed');
      setInvoice((prev) =>
        prev ? { ...prev, status: 'paid', paidAt: new Date().toISOString() } : prev,
      );
      toast.success('Invoice marked as paid');
    } catch {
      toast.error('Failed to update invoice');
    }
  }, [invoice, toast]);

  const handleSendReminder = useCallback(async () => {
    if (invoice === null) return;
    try {
      const res = await fetch(`/api/admin/payments/invoices/${invoice.id}/remind`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Request failed');
      toast.success('Payment reminder sent');
    } catch {
      toast.error('Failed to send reminder');
    }
  }, [invoice, toast]);

  const handleRefund = useCallback(async () => {
    if (invoice === null) return;
    try {
      const res = await fetch(`/api/admin/payments/invoices/${invoice.id}/refund`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Request failed');
      setInvoice((prev) => (prev ? { ...prev, status: 'refunded' } : prev));
      toast.success('Invoice refunded');
    } catch {
      toast.error('Failed to process refund');
    }
  }, [invoice, toast]);

  const handleBack = useCallback(() => {
    router.push(`/${locale}/admin/payments`);
  }, [router, locale]);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return <AdminPaymentDetailSkeleton />;
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error !== null || invoice === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center"
        role="alert"
        aria-live="assertive"
      >
        <span className="text-4xl" aria-hidden="true">
          {error === 'Invoice not found' ? '🔍' : '⚠️'}
        </span>
        <div>
          <p className="font-semibold text-[var(--text-primary)]">
            {error === 'Invoice not found' ? 'Invoice Not Found' : 'Failed to Load Invoice'}
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {error ?? 'An unexpected error occurred.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleBack}
            className="
              rounded-lg border border-[var(--border-default)]
              bg-[var(--bg-surface)] px-5 py-2.5
              text-sm font-medium text-[var(--text-primary)]
              hover:bg-[var(--bg-surface-hover)] transition-colors
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2
            "
            type="button"
          >
            ← Back to Payments
          </motion.button>
          {error !== 'Invoice not found' && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { void fetchInvoice(); }}
              className="
                rounded-lg bg-[var(--brand-primary)] px-5 py-2.5
                text-sm font-medium text-[var(--text-on-brand)]
                hover:bg-[var(--brand-primary-hover)] transition-colors
                focus-visible:outline-none focus-visible:ring-2
                focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2
              "
              type="button"
            >
              Retry
            </motion.button>
          )}
        </div>
      </motion.div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Breadcrumb / back ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleBack}
          className="
            flex min-h-[44px] items-center gap-1.5 rounded-lg
            px-3 py-2 text-sm font-medium text-[var(--text-secondary)]
            hover:bg-[var(--bg-surface-hover)] transition-colors
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2
          "
          type="button"
          aria-label="Back to payments list"
        >
          <span aria-hidden="true">←</span>
          <span>Payments</span>
        </motion.button>
        <span className="text-[var(--text-muted)]" aria-hidden="true">/</span>
        <span className="text-sm font-medium text-[var(--text-primary)]">
          Invoice #{invoice.id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      {/* ── Invoice detail ─────────────────────────────────────────────── */}
      <InvoiceDetail
        invoice={invoice}
        canRefund={true}
        onMarkPaid={() => { void handleMarkPaid(); }}
        onSendReminder={() => { void handleSendReminder(); }}
        onRefund={() => { void handleRefund(); }}
      />
    </motion.div>
  );
}
