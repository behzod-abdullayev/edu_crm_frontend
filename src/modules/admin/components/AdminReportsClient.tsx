'use client';

// src/modules/admin/components/AdminReportsClient.tsx

import { useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ReportGenerator } from './ReportGenerator';
import { useAdminReports } from '../hooks/useAdmin';
import { useToast } from '@shared/hooks/useToast';
import type { ReportType } from '../types/admin.types';

// ─── i18n ───────────────────────────────────────────────────────────────────

const I18N = {
  uz: {
    subtitle: "Davomat, moliyaviy va o'zlashtirish hisobotlarini yarating va yuklab oling (CSV)",
    success: 'Hisobot muvaffaqiyatli yuklab olindi',
    failed: "Hisobotni yaratib bo'lmadi. Qaytadan urinib ko'ring.",
  },
  en: {
    subtitle: 'Generate and download attendance, financial, and performance reports (CSV)',
    success: 'Report downloaded successfully',
    failed: 'Failed to generate report. Please try again.',
  },
  ru: {
    subtitle: 'Создавайте и скачивайте отчёты по посещаемости, финансам и успеваемости (CSV)',
    success: 'Отчёт успешно скачан',
    failed: 'Не удалось создать отчёт. Попробуйте снова.',
  },
} as const;

type Locale = keyof typeof I18N;

// ─── Page transition ──────────────────────────────────────────────────────────

const pageVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ─── AdminReportsClient ───────────────────────────────────────────────────────

export function AdminReportsClient() {
  const t          = useTranslations('admin.reports');
  const rawLocale  = useLocale();
  const locale: Locale = rawLocale in I18N ? (rawLocale as Locale) : 'en';
  const s          = I18N[locale];
  const { toast }  = useToast();

  const { generateReport } = useAdminReports();

  // ── Handler ───────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(
    async (request: { type: ReportType; startDate: string; endDate: string }) => {
      try {
        await generateReport(request);
        toast.success(s.success);
      } catch {
        toast.error(s.failed);
        throw new Error('generation failed');
      }
    },
    [generateReport, toast, s],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Page header ────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">
          {s.subtitle}
        </p>
      </div>

      {/* ── Report generator card ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-6"
      >
        <ReportGenerator onGenerate={handleGenerate} />
      </motion.div>
    </motion.div>
  );
}
