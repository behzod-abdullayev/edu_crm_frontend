'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/utils/cn';
import type { ReportType, ReportRecord } from '../types/admin.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportGeneratorProps {
  recentReports: ReportRecord[];
  isLoading: boolean;
  onGenerate: (
    request: { type: ReportType; startDate: string; endDate: string },
    format: 'PDF' | 'Excel' | 'CSV',
  ) => Promise<void>;
}

type ExportFormat = 'PDF' | 'Excel' | 'CSV';

interface FormState {
  type: ReportType;
  startDate: string;
  endDate: string;
  format: ExportFormat;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const REPORT_TYPES: Array<{ value: ReportType; label: string; icon: string; description: string }> = [
  {
    value: 'attendance',
    label: 'Attendance Report',
    icon: '📅',
    description: 'Student and group attendance analytics',
  },
  {
    value: 'financial',
    label: 'Financial Report',
    icon: '💰',
    description: 'Revenue, payments, and debt breakdown',
  },
  {
    value: 'performance',
    label: 'Performance Report',
    icon: '📈',
    description: 'Grades, homework completion, exam results',
  },
];

const EXPORT_FORMATS: Array<{ value: ExportFormat; icon: string }> = [
  { value: 'PDF',   icon: '📄' },
  { value: 'Excel', icon: '📊' },
  { value: 'CSV',   icon: '📋' },
];

const STATUS_COLORS: Record<string, string> = {
  attendance:  'var(--info-solid)',
  financial:   'var(--success-solid)',
  performance: 'var(--brand-accent)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function thirtyDaysAgoIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function formatReportDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function ReportRowSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-center justify-between gap-4 border-b border-[var(--border-default)] px-4 py-3 last:border-0"
      aria-hidden="true"
    >
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-8 rounded-lg"
          style={{
            background: `linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s linear infinite',
          }}
        />
        <div className="space-y-1.5">
          <div
            className="h-3.5 w-40 rounded"
            style={{
              background: `linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s linear infinite',
            }}
          />
          <div
            className="h-3 w-28 rounded"
            style={{
              background: `linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s linear infinite',
            }}
          />
        </div>
      </div>
      <div
        className="h-8 w-20 rounded-lg"
        style={{
          background: `linear-gradient(90deg, var(--bg-surface-hover) 25%, var(--bg-surface) 50%, var(--bg-surface-hover) 75%)`,
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s linear infinite',
        }}
      />
    </motion.div>
  );
}

// ─── Report type selector ─────────────────────────────────────────────────────

interface ReportTypeSelectorProps {
  selected: ReportType;
  onChange: (value: ReportType) => void;
}

function ReportTypeSelector({ selected, onChange }: ReportTypeSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Report Type
      </legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {REPORT_TYPES.map((rt) => {
          const isActive = selected === rt.value;
          return (
            <motion.button
              key={rt.value}
              type="button"
              onClick={() => onChange(rt.value)}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'flex flex-col items-start rounded-xl border p-3 text-left',
                'min-h-[44px] transition-all duration-[var(--transition-base)]',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
                isActive
                  ? 'border-[var(--brand-primary)] bg-[var(--bg-surface-secondary)] ring-1 ring-[var(--brand-primary)]'
                  : 'border-[var(--border-default)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)]',
              )}
              aria-pressed={isActive}
              aria-label={rt.label}
            >
              <span className="text-xl" aria-hidden="true">
                {rt.icon}
              </span>
              <span
                className={cn(
                  'mt-1.5 text-sm font-semibold',
                  isActive
                    ? 'text-[var(--brand-primary)]'
                    : 'text-[var(--text-primary)]',
                )}
              >
                {rt.label}
              </span>
              <span className="mt-0.5 text-xs text-[var(--text-muted)]">
                {rt.description}
              </span>
            </motion.button>
          );
        })}
      </div>
    </fieldset>
  );
}

// ─── ReportGenerator ──────────────────────────────────────────────────────────

export function ReportGenerator({
  recentReports,
  isLoading,
  onGenerate,
}: ReportGeneratorProps) {
  const [form, setForm] = useState<FormState>({
    type: 'attendance',
    startDate: thirtyDaysAgoIso(),
    endDate: todayIso(),
    format: 'PDF',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const validate = (): string | null => {
    if (!form.startDate) return 'Start date is required.';
    if (!form.endDate)   return 'End date is required.';
    if (form.startDate > form.endDate)
      return 'Start date must be before end date.';
    return null;
  };

  const handleGenerate = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      await onGenerate(
        { type: form.type, startDate: form.startDate, endDate: form.endDate },
        form.format,
      );
      setGeneratedId(`generated-${Date.now()}`);
      setTimeout(() => setGeneratedId(null), 3000);
    } catch {
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Generate Form ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
        role="region"
        aria-label="Generate new report"
      >
        <div className="border-b border-[var(--border-default)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Generate Report
          </h3>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            Select type, date range, and export format
          </p>
        </div>

        <div className="space-y-5 p-4">

          {/* Report type */}
          <ReportTypeSelector
            selected={form.type}
            onChange={(v) => setField('type', v)}
          />

          {/* Date range */}
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Date Range
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="report-start-date"
                  className="text-xs font-medium text-[var(--text-secondary)]"
                >
                  Start Date
                </label>
                <input
                  id="report-start-date"
                  type="date"
                  value={form.startDate}
                  max={form.endDate}
                  onChange={(e) => setField('startDate', e.target.value)}
                  className={cn(
                    'w-full min-h-[44px] rounded-lg border bg-[var(--bg-surface)] px-3 py-2.5',
                    'text-sm text-[var(--text-primary)]',
                    'border-[var(--border-default)]',
                    'focus:border-[var(--border-focus)] focus:outline-none',
                    'focus:ring-2 focus:ring-[var(--border-focus)]',
                    'transition-[border-color,box-shadow] duration-[var(--transition-fast)]',
                    error?.includes('Start') && 'border-[var(--error-solid)] ring-1 ring-[var(--error-solid)]',
                  )}
                  aria-required="true"
                  aria-describedby={error ? 'report-error' : undefined}
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="report-end-date"
                  className="text-xs font-medium text-[var(--text-secondary)]"
                >
                  End Date
                </label>
                <input
                  id="report-end-date"
                  type="date"
                  value={form.endDate}
                  min={form.startDate}
                  onChange={(e) => setField('endDate', e.target.value)}
                  className={cn(
                    'w-full min-h-[44px] rounded-lg border bg-[var(--bg-surface)] px-3 py-2.5',
                    'text-sm text-[var(--text-primary)]',
                    'border-[var(--border-default)]',
                    'focus:border-[var(--border-focus)] focus:outline-none',
                    'focus:ring-2 focus:ring-[var(--border-focus)]',
                    'transition-[border-color,box-shadow] duration-[var(--transition-fast)]',
                    error?.includes('End') && 'border-[var(--error-solid)] ring-1 ring-[var(--error-solid)]',
                  )}
                  aria-required="true"
                  aria-describedby={error ? 'report-error' : undefined}
                />
              </div>
            </div>
          </fieldset>

          {/* Export format */}
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Export Format
            </legend>
            <div className="flex flex-wrap gap-2">
              {EXPORT_FORMATS.map((fmt) => {
                const isActive = form.format === fmt.value;
                return (
                  <motion.button
                    key={fmt.value}
                    type="button"
                    onClick={() => setField('format', fmt.value)}
                    whileTap={{ scale: 0.96 }}
                    className={cn(
                      'flex min-h-[44px] items-center gap-2 rounded-lg border px-4 py-2',
                      'text-sm font-medium transition-all duration-[var(--transition-fast)]',
                      'focus-visible:outline-none focus-visible:ring-2',
                      'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
                      isActive
                        ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white'
                        : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)]',
                    )}
                    aria-pressed={isActive}
                    aria-label={`Export as ${fmt.value}`}
                  >
                    <span aria-hidden="true">{fmt.icon}</span>
                    {fmt.value}
                  </motion.button>
                );
              })}
            </div>
          </fieldset>

          {/* Validation error */}
          <AnimatePresence>
            {error && (
              <motion.p
                id="report-error"
                role="alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--error-solid)]"
              >
                <span aria-hidden="true">⚠️</span>
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Success flash */}
          <AnimatePresence>
            {generatedId && (
              <motion.p
                key={generatedId}
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--success-text)]"
              >
                <span aria-hidden="true">✅</span>
                Report generated successfully — download started.
              </motion.p>
            )}
          </AnimatePresence>

          {/* Generate button */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <motion.button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={isGenerating}
              whileTap={{ scale: 0.97 }}
              className={cn(
                'flex w-full sm:w-auto items-center justify-center gap-2',
                'min-h-[44px] rounded-xl px-6 py-2.5 text-sm font-semibold',
                'bg-[var(--brand-primary)] text-white',
                'hover:bg-[var(--brand-primary-hover)]',
                'disabled:cursor-not-allowed disabled:opacity-60',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
                'transition-[background-color,opacity] duration-[var(--transition-base)]',
              )}
              aria-label={isGenerating ? 'Generating report…' : 'Generate report'}
              aria-busy={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                    aria-hidden="true"
                  />
                  Generating…
                </>
              ) : (
                <>
                  <span aria-hidden="true">⬇️</span>
                  Generate &amp; Download
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── Recent Reports ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.08 }}
        className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
        role="region"
        aria-label="Recent reports"
      >
        <div className="border-b border-[var(--border-default)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Recent Reports
          </h3>
        </div>

        {isLoading ? (
          <div aria-label="Loading recent reports" aria-busy="true">
            {Array.from({ length: 4 }, (_, i) => (
              <ReportRowSkeleton key={i} index={i} />
            ))}
          </div>
        ) : recentReports.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center px-4 py-10 text-center"
          >
            <span className="text-3xl" aria-hidden="true">📂</span>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              No reports generated yet.
            </p>
          </motion.div>
        ) : (
          <ul
            className="divide-y divide-[var(--border-default)]"
            aria-label="List of recent reports"
          >
            {recentReports.map((report, index) => (
              <motion.li
                key={report.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.04, 0.32) }}
                className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-[var(--bg-surface-hover)] sm:flex-row sm:items-center sm:gap-4"
              >
                {/* Icon */}
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
                  style={{
                    backgroundColor: `${STATUS_COLORS[report.type] ?? 'var(--brand-primary)'}22`,
                    color: STATUS_COLORS[report.type] ?? 'var(--brand-primary)',
                  }}
                  aria-hidden="true"
                >
                  {REPORT_TYPES.find((r) => r.value === report.type)?.icon ?? '📄'}
                </span>

                {/* Meta */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                    {report.name}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    By {report.generatedBy} ·{' '}
                    <time dateTime={report.generatedAt}>
                      {formatReportDate(report.generatedAt)}
                    </time>
                  </p>
                </div>

                {/* Download */}
                <motion.a
                  href={report.url}
                  download
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={cn(
                    'flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2',
                    'text-xs font-medium text-[var(--brand-primary)]',
                    'border-[var(--border-default)]',
                    'hover:border-[var(--brand-primary)] hover:bg-[var(--bg-surface-hover)]',
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1',
                    'transition-colors duration-[var(--transition-fast)]',
                    'sm:min-h-0',
                  )}
                  aria-label={`Download ${report.name}`}
                >
                  <span aria-hidden="true">⬇️</span>
                  Download
                </motion.a>
              </motion.li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
}
