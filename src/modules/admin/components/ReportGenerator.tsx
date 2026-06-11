'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/utils/cn';
import type { ReportType } from '../types/admin.types';

// ─── i18n ───────────────────────────────────────────────────────────────────

const I18N = {
  uz: {
    typeLegend: 'Hisobot turi',
    types: {
      attendance: { label: 'Davomat hisoboti', description: "O'quvchilar va guruhlar davomati tahlili" },
      financial: { label: 'Moliyaviy hisobot', description: "Daromad, to'lovlar va qarzdorlik tafsiloti" },
      performance: { label: "O'zlashtirish hisoboti", description: "Baholar, uy vazifalari va imtihon natijalari" },
    },
    dateRangeLegend: 'Sana oralig\'i',
    startDate: 'Boshlanish sanasi',
    endDate: 'Tugash sanasi',
    formTitle: 'Hisobot yaratish',
    formSubtitle: "Turi va sana oralig'ini tanlang",
    generate: 'Hisobot yaratish',
    generating: 'Yaratilmoqda…',
    generateAria: 'Hisobotni yaratish',
    generatingAria: 'Hisobot yaratilmoqda…',
    success: 'Hisobot muvaffaqiyatli yaratildi — yuklab olish boshlandi.',
    errors: {
      startRequired: 'Boshlanish sanasini kiriting.',
      endRequired: 'Tugash sanasini kiriting.',
      startBeforeEnd: 'Boshlanish sanasi tugash sanasidan oldin bo\'lishi kerak.',
      generateFailed: "Hisobotni yaratib bo'lmadi. Qaytadan urinib ko'ring.",
    },
  },
  en: {
    typeLegend: 'Report Type',
    types: {
      attendance: { label: 'Attendance Report', description: 'Student and group attendance analytics' },
      financial: { label: 'Financial Report', description: 'Revenue, payments, and debt breakdown' },
      performance: { label: 'Performance Report', description: 'Grades, homework completion, exam results' },
    },
    dateRangeLegend: 'Date Range',
    startDate: 'Start Date',
    endDate: 'End Date',
    formTitle: 'Generate Report',
    formSubtitle: 'Select type and date range',
    generate: 'Generate & Download',
    generating: 'Generating…',
    generateAria: 'Generate report',
    generatingAria: 'Generating report…',
    success: 'Report generated successfully — download started.',
    errors: {
      startRequired: 'Start date is required.',
      endRequired: 'End date is required.',
      startBeforeEnd: 'Start date must be before end date.',
      generateFailed: 'Failed to generate report. Please try again.',
    },
  },
  ru: {
    typeLegend: 'Тип отчёта',
    types: {
      attendance: { label: 'Отчёт по посещаемости', description: 'Аналитика посещаемости студентов и групп' },
      financial: { label: 'Финансовый отчёт', description: 'Доходы, платежи и задолженности' },
      performance: { label: 'Отчёт об успеваемости', description: 'Оценки, домашние задания, результаты экзаменов' },
    },
    dateRangeLegend: 'Период',
    startDate: 'Дата начала',
    endDate: 'Дата окончания',
    formTitle: 'Создать отчёт',
    formSubtitle: 'Выберите тип и период',
    generate: 'Создать и скачать',
    generating: 'Создание…',
    generateAria: 'Создать отчёт',
    generatingAria: 'Отчёт создаётся…',
    success: 'Отчёт успешно создан — загрузка началась.',
    errors: {
      startRequired: 'Укажите дату начала.',
      endRequired: 'Укажите дату окончания.',
      startBeforeEnd: 'Дата начала должна быть раньше даты окончания.',
      generateFailed: 'Не удалось создать отчёт. Попробуйте снова.',
    },
  },
} as const;

type Locale = keyof typeof I18N;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReportGeneratorProps {
  onGenerate: (request: { type: ReportType; startDate: string; endDate: string }) => Promise<void>;
}

interface FormState {
  type: ReportType;
  startDate: string;
  endDate: string;
}

const REPORT_TYPE_ICONS: Record<ReportType, string> = {
  attendance: '📅',
  financial: '💰',
  performance: '📈',
};

const REPORT_TYPE_ORDER: ReportType[] = ['attendance', 'financial', 'performance'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function thirtyDaysAgoIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

// ─── Report type selector ─────────────────────────────────────────────────────

interface ReportTypeSelectorProps {
  selected: ReportType;
  onChange: (value: ReportType) => void;
  s: (typeof I18N)[Locale];
}

function ReportTypeSelector({ selected, onChange, s }: ReportTypeSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        {s.typeLegend}
      </legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {REPORT_TYPE_ORDER.map((value) => {
          const isActive = selected === value;
          const meta = s.types[value];
          return (
            <motion.button
              key={value}
              type="button"
              onClick={() => onChange(value)}
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
              aria-label={meta.label}
            >
              <span className="text-xl" aria-hidden="true">
                {REPORT_TYPE_ICONS[value]}
              </span>
              <span
                className={cn(
                  'mt-1.5 text-sm font-semibold',
                  isActive
                    ? 'text-[var(--brand-primary)]'
                    : 'text-[var(--text-primary)]',
                )}
              >
                {meta.label}
              </span>
              <span className="mt-0.5 text-xs text-[var(--text-muted)]">
                {meta.description}
              </span>
            </motion.button>
          );
        })}
      </div>
    </fieldset>
  );
}

// ─── ReportGenerator ──────────────────────────────────────────────────────────

export function ReportGenerator({ onGenerate }: ReportGeneratorProps) {
  const rawLocale = useLocale();
  const locale: Locale = rawLocale in I18N ? (rawLocale as Locale) : 'en';
  const s = I18N[locale];

  const [form, setForm] = useState<FormState>({
    type: 'attendance',
    startDate: thirtyDaysAgoIso(),
    endDate: todayIso(),
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const validate = (): string | null => {
    if (!form.startDate) return s.errors.startRequired;
    if (!form.endDate)   return s.errors.endRequired;
    if (form.startDate > form.endDate)
      return s.errors.startBeforeEnd;
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
      await onGenerate({ type: form.type, startDate: form.startDate, endDate: form.endDate });
      setGeneratedId(`generated-${Date.now()}`);
      setTimeout(() => setGeneratedId(null), 3000);
    } catch {
      setError(s.errors.generateFailed);
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
        aria-label={s.formTitle}
      >
        <div className="border-b border-[var(--border-default)] px-4 py-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {s.formTitle}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">
            {s.formSubtitle}
          </p>
        </div>

        <div className="space-y-5 p-4">

          {/* Report type */}
          <ReportTypeSelector
            selected={form.type}
            onChange={(v) => setField('type', v)}
            s={s}
          />

          {/* Date range */}
          <fieldset>
            <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {s.dateRangeLegend}
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="report-start-date"
                  className="text-xs font-medium text-[var(--text-secondary)]"
                >
                  {s.startDate}
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
                    error === s.errors.startRequired && 'border-[var(--error-solid)] ring-1 ring-[var(--error-solid)]',
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
                  {s.endDate}
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
                    (error === s.errors.endRequired || error === s.errors.startBeforeEnd) && 'border-[var(--error-solid)] ring-1 ring-[var(--error-solid)]',
                  )}
                  aria-required="true"
                  aria-describedby={error ? 'report-error' : undefined}
                />
              </div>
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
                {s.success}
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
              aria-label={isGenerating ? s.generatingAria : s.generateAria}
              aria-busy={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                    aria-hidden="true"
                  />
                  {s.generating}
                </>
              ) : (
                <>
                  <span aria-hidden="true">⬇️</span>
                  {s.generate}
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
