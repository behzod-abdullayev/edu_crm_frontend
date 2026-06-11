'use client';

// src/modules/admin/components/AdminPaymentsClient.tsx

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { usePayments } from '@/modules/payments/hooks/usePayments';
import { PaymentOverview } from '@/modules/payments/components/PaymentOverview';
import { InvoiceList } from '@/modules/payments/components/InvoiceList';
import { DebtCalculator } from '@/modules/payments/components/DebtCalculator';
import { AdminPaymentsSkeleton } from './AdminPaymentsSkeleton';
import { useToast } from '@shared/hooks/useToast';
import { useIsMobile } from '@shared/hooks/useIsMobile';

// ─── i18n ───────────────────────────────────────────────────────────────────

const I18N = {
  uz: {
    subtitle: "Hisob-fakturalar, to'lovlar va qarzdorlikni boshqarish",
    errorTitle: "To'lovlarni yuklab bo'lmadi",
    retry: 'Qayta urinish',
    refresh: 'Yangilash',
    refreshAria: "To'lovlarni yangilash",
    createInvoice: 'Hisob-faktura',
    createInvoiceAria: 'Hisob-faktura yaratish',
    tablistAria: "To'lov ko'rinishlari",
    tabs: { invoices: 'Hisob-fakturalar', debts: 'Qarzdorliklar' },
    toast: {
      markPaidSuccess: "Hisob-faktura to'langan deb belgilandi",
      markPaidFailed: "Hisob-fakturani to'langan deb belgilab bo'lmadi",
      createInvoiceInfo: 'Hisob-faktura yaratish formasi tez orada ishga tushadi',
      exportSuccess: 'Muvaffaqiyatli eksport qilindi',
      exportEmpty: "Eksport qilish uchun hisob-fakturalar yo'q",
      reminderUnavailable: 'Eslatma yuborish funksiyasi hozircha mavjud emas',
    },
  },
  en: {
    subtitle: 'Manage invoices, payments, and outstanding debts',
    errorTitle: 'Failed to load payments',
    retry: 'Retry',
    refresh: 'Refresh',
    refreshAria: 'Refresh payments',
    createInvoice: 'New Invoice',
    createInvoiceAria: 'Create invoice',
    tablistAria: 'Payment views',
    tabs: { invoices: 'Invoices', debts: 'Debts' },
    toast: {
      markPaidSuccess: 'Invoice marked as paid',
      markPaidFailed: 'Failed to mark invoice as paid',
      createInvoiceInfo: 'Invoice creation form is coming soon',
      exportSuccess: 'Exported successfully',
      exportEmpty: 'No invoices to export',
      reminderUnavailable: 'Sending reminders is not available yet',
    },
  },
  ru: {
    subtitle: 'Управление счетами, платежами и задолженностями',
    errorTitle: 'Не удалось загрузить платежи',
    retry: 'Повторить',
    refresh: 'Обновить',
    refreshAria: 'Обновить платежи',
    createInvoice: 'Новый счёт',
    createInvoiceAria: 'Создать счёт',
    tablistAria: 'Виды платежей',
    tabs: { invoices: 'Счета', debts: 'Задолженности' },
    toast: {
      markPaidSuccess: 'Счёт отмечен как оплаченный',
      markPaidFailed: 'Не удалось отметить счёт как оплаченный',
      createInvoiceInfo: 'Форма создания счёта скоро появится',
      exportSuccess: 'Экспорт выполнен успешно',
      exportEmpty: 'Нет счетов для экспорта',
      reminderUnavailable: 'Отправка напоминаний пока недоступна',
    },
  },
} as const;

type Locale = keyof typeof I18N;

// ─── Tab definitions ──────────────────────────────────────────────────────────

type Tab = 'invoices' | 'debts';

// ─── Page transition ──────────────────────────────────────────────────────────

const pageVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ─── CSV export helper ─────────────────────────────────────────────────────────

function escapeCsvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

// ─── AdminPaymentsClient ──────────────────────────────────────────────────────

export function AdminPaymentsClient() {
  const t          = useTranslations('admin.payments');
  const rawLocale  = useLocale();
  const locale: Locale = rawLocale in I18N ? (rawLocale as Locale) : 'en';
  const s          = I18N[locale];
  const router     = useRouter();
  const isMobile   = useIsMobile();
  const { toast }  = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('invoices');

  const TABS: { value: Tab; label: string; icon: string }[] = [
    { value: 'invoices', label: s.tabs.invoices, icon: '🧾' },
    { value: 'debts',    label: s.tabs.debts,    icon: '⚠️' },
  ];

  const {
    overview,
    invoices,
    monthlyRevenue,
    debts,
    isLoading,
    error,
    markPaid,
    refresh,
  } = usePayments();

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleMarkPaid = useCallback(
    async (id: string) => {
      try {
        await markPaid(id);
        toast.success(s.toast.markPaidSuccess);
      } catch {
        toast.error(s.toast.markPaidFailed);
      }
    },
    [markPaid, toast, s],
  );

  const handleCreateInvoice = useCallback(() => {
    toast.info(s.toast.createInvoiceInfo);
  }, [toast, s]);

  const handleViewDetail = useCallback(
    (id: string) => {
      router.push(`/${locale}/admin/payments/${id}`);
    },
    [router, locale],
  );

  const handleExport = useCallback(
    (ids: string[]) => {
      const rows = ids.length > 0 ? invoices.filter((inv) => ids.includes(inv.id)) : invoices;
      if (rows.length === 0) {
        toast.info(s.toast.exportEmpty);
        return;
      }

      const header = ['Student', 'Course', 'Amount', 'Currency', 'Status', 'Due Date'].join(',');
      const csvRows = rows.map((inv) =>
        [
          escapeCsvField(inv.studentName),
          escapeCsvField(inv.courseName),
          String(inv.amount),
          inv.currency,
          inv.status,
          inv.dueDate,
        ].join(','),
      );
      const csv = [header, ...csvRows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(s.toast.exportSuccess);
    },
    [invoices, toast, s],
  );

  const handleSendReminder = useCallback(() => {
    toast.info(s.toast.reminderUnavailable);
  }, [toast, s]);

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return <AdminPaymentsSkeleton />;
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error !== null) {
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
          <p className="font-semibold text-[var(--text-primary)]">{s.errorTitle}</p>
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
          {s.retry}
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
            {s.subtitle}
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
            aria-label={s.refreshAria}
          >
            <span aria-hidden="true">↻</span>
            {!isMobile && <span>{s.refresh}</span>}
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
            aria-label={s.createInvoiceAria}
          >
            <span aria-hidden="true">+</span>
            {!isMobile && <span>{s.createInvoice}</span>}
          </motion.button>
        </div>
      </div>

      {/* ── Overview KPI cards ─────────────────────────────────────────── */}
      {overview !== null && (
        <PaymentOverview data={overview} monthlyRevenue={monthlyRevenue} />
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="border-b border-[var(--border-default)]">
        <nav
          className="flex gap-0"
          role="tablist"
          aria-label={s.tablistAria}
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
      {activeTab === 'invoices' ? (
        <motion.div
          key="invoices"
          id="panel-invoices"
          role="tabpanel"
          aria-labelledby="tab-invoices"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <InvoiceList
            invoices={invoices}
            canManage={true}
            onMarkPaid={(id) => { void handleMarkPaid(id); }}
            onSendReminder={handleSendReminder}
            onCreateInvoice={handleCreateInvoice}
            onViewDetail={handleViewDetail}
            onExport={handleExport}
          />
        </motion.div>
      ) : (
        <motion.div
          key="debts"
          id="panel-debts"
          role="tabpanel"
          aria-labelledby="tab-debts"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <DebtCalculator
            debts={debts}
            onSendReminder={handleSendReminder}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
