'use client';

// src/modules/admin/components/AdminPaymentsClient.tsx

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { usePayments } from '@/modules/payments/hooks/usePayments';
import { PaymentOverview } from '@/modules/payments/components/PaymentOverview';
import { InvoiceList } from '@/modules/payments/components/InvoiceList';
import { DebtCalculator } from '@/modules/payments/components/DebtCalculator';
import { AdminPaymentsSkeleton } from './AdminPaymentsSkeleton';
import { useToast } from '@shared/hooks/useToast';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import type { InvoiceDto } from '@/modules/payments/types/payment.types';

// ─── Tab definitions ──────────────────────────────────────────────────────────

type Tab = 'invoices' | 'debts';

const TABS: { value: Tab; label: string; icon: string }[] = [
  { value: 'invoices', label: 'Invoices', icon: '🧾' },
  { value: 'debts',    label: 'Debts',    icon: '⚠️' },
];

// ─── Page transition ──────────────────────────────────────────────────────────

const pageVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ─── AdminPaymentsClient ──────────────────────────────────────────────────────

export function AdminPaymentsClient() {
  const t         = useTranslations('admin.payments');
  const locale    = useLocale();
  const router    = useRouter();
  const isMobile  = useIsMobile();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('invoices');

  const {
    overview,
    invoices,
    debts,
    isLoading,
    isOffline,
    error,
    markPaid,
    createInvoice,
    sendReminder,
    refundInvoice,
    refresh,
  } = usePayments();

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleMarkPaid = useCallback(
    async (id: string) => {
      try {
        await markPaid(id);
        toast.success('Invoice marked as paid');
      } catch {
        toast.error('Failed to mark invoice as paid');
      }
    },
    [markPaid, toast],
  );

  const handleCreateInvoice = useCallback(() => {
    // Open create modal / navigate to create form (implementation via modal in full version)
    toast.info('Invoice creation form would open here');
  }, [toast]);

  const handleViewDetail = useCallback(
    (id: string) => {
      router.push(`/${locale}/admin/payments/${id}`);
    },
    [router, locale],
  );

  const handleExport = useCallback(async (_ids?: string[]) => {
    try {
      const res = await fetch('/api/admin/payments/invoices/export?format=csv');
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exported successfully');
    } catch {
      toast.error('Export failed');
    }
  }, [toast]);

  const handleSendReminder = useCallback(
    async (studentId: string) => {
      try {
        await sendReminder(studentId);
        toast.success('Reminder sent');
      } catch {
        toast.error('Failed to send reminder');
      }
    },
    [sendReminder, toast],
  );

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return <AdminPaymentsSkeleton />;
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error !== null && !isOffline) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center"
        role="alert"
        aria-live="assertive"
      >
        <span className="text-4xl" aria-hidden="true">⚠️</span>
        <div>
          <p className="font-semibold text-[var(--text-primary)]">Failed to load payments</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{error}</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { void refresh(); }}
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
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
            {t('title')}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            Manage invoices, payments, and outstanding debts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { void refresh(); }}
            className="
              flex min-h-[44px] items-center gap-2 rounded-lg
              border border-[var(--border-default)] bg-[var(--bg-surface)]
              px-3 py-2.5 text-sm font-medium text-[var(--text-secondary)]
              transition-colors hover:bg-[var(--bg-surface-hover)]
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2
            "
            type="button"
            aria-label="Refresh payments"
          >
            <span aria-hidden="true">↻</span>
            {!isMobile && <span>Refresh</span>}
          </motion.button>

          {/* Create invoice */}
          <motion.button
            whileHover={{ y: -1, boxShadow: 'var(--shadow-md)' }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCreateInvoice}
            className="
              flex min-h-[44px] items-center gap-2 rounded-lg
              bg-[var(--brand-primary)] px-4 py-2.5
              text-sm font-medium text-[var(--text-on-brand)]
              hover:bg-[var(--brand-primary-hover)] transition-colors
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2
            "
            type="button"
            aria-label="Create invoice"
          >
            <span aria-hidden="true">+</span>
            {!isMobile && <span>New Invoice</span>}
          </motion.button>
        </div>
      </div>

      {/* ── Offline banner ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center gap-2 rounded-lg border border-[var(--warning-border)] bg-[var(--warning-bg)] px-4 py-3 text-sm text-[var(--warning-text)]"
              role="status"
              aria-live="polite"
            >
              <span aria-hidden="true">📶</span>
              <span>
                You&rsquo;re offline. Showing cached data.
                Connect to the internet to see real-time updates.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Overview KPI cards ─────────────────────────────────────────── */}
      {overview !== null && (
        <PaymentOverview data={overview} isOffline={isOffline} />
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="border-b border-[var(--border-default)]">
        <nav
          className="flex gap-0"
          role="tablist"
          aria-label="Payment views"
        >
          {TABS.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={activeTab === tab.value}
              aria-controls={`panel-${tab.value}`}
              id={`tab-${tab.value}`}
              onClick={() => setActiveTab(tab.value)}
              className={[
                'relative flex min-h-[44px] items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-inset',
                activeTab === tab.value
                  ? 'text-[var(--brand-primary)] after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-[var(--brand-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              ].join(' ')}
              type="button"
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab panels ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'invoices' && (
          <motion.div
            key="invoices"
            id="panel-invoices"
            role="tabpanel"
            aria-labelledby="tab-invoices"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <InvoiceList
              invoices={invoices}
              canManage={true}
              onMarkPaid={(id) => { void handleMarkPaid(id); }}
              onSendReminder={(id) => { void handleSendReminder(id); }}
              onCreateInvoice={handleCreateInvoice}
              onViewDetail={handleViewDetail}
              onExport={(ids) => { void handleExport(ids); }}
            />
          </motion.div>
        )}

        {activeTab === 'debts' && (
          <motion.div
            key="debts"
            id="panel-debts"
            role="tabpanel"
            aria-labelledby="tab-debts"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <DebtCalculator
              debts={debts}
              onSendReminder={(studentId) => { void handleSendReminder(studentId); }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}