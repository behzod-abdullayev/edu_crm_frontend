'use client';

// src/modules/admin/components/AdminReportsClient.tsx

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ReportGenerator } from './ReportGenerator';
import { AdminReportsSkeleton } from './AdminReportsSkeleton';
import { useAdminReports } from '../hooks/useAdmin';
import { useToast } from '@shared/hooks/useToast';
import type { ReportRequest } from '../types/admin.types';

// ─── Export format type (matches ReportGenerator) ─────────────────────────────

type ExportFormat = 'PDF' | 'CSV' | 'Excel';

// ─── Page transition ──────────────────────────────────────────────────────────

const pageVariants = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ─── AdminReportsClient ───────────────────────────────────────────────────────

export function AdminReportsClient() {
  const t         = useTranslations('admin.reports');
  const { toast } = useToast();

  const {
    recentReports,
    isLoading,
    generateReport,
  } = useAdminReports();

  // ── Handler ───────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(
    async (
      request: { type: ReportRequest['type']; startDate: string; endDate: string },
      format: ExportFormat,
    ) => {
      try {
        await generateReport(
          {
            type: request.type,
            startDate: request.startDate,
            endDate: request.endDate,
          },
          format,
        );
        toast.success(`${format} report generated successfully`);
      } catch {
        toast.error('Failed to generate report. Please try again.');
        throw new Error('generation failed');
      }
    },
    [generateReport, toast],
  );

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return <AdminReportsSkeleton />;
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
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
          {t('title')}
        </h1>
        <p className="mt-0.5 text-sm text-[var(--text-muted)]">
          Generate and download attendance, financial, and performance reports
        </p>
      </div>

      {/* ── Report generator card ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 sm:p-6"
      >
        <ReportGenerator
          recentReports={recentReports}
          isLoading={false}
          onGenerate={handleGenerate}
        />
      </motion.div>
    </motion.div>
  );
}