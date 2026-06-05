'use client';

import { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/utils/cn';
import type { TenantConfig, FeatureFlags } from '../types/admin.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TenantConfigFormProps {
  initialConfig: TenantConfig;
  onSave: (config: TenantConfig) => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIMEZONES = [
  'Asia/Tashkent',
  'Asia/Almaty',
  'Asia/Dubai',
  'Europe/Moscow',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Tokyo',
] as const;

const CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB', 'KZT'] as const;

const FEATURE_FLAGS: Array<{
  key: keyof FeatureFlags;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    key: 'payments',
    label: 'Payment Module',
    description: 'Invoices, subscriptions, and debt tracking',
    icon: '💳',
  },
  {
    key: 'chat',
    label: 'Chat / Messaging',
    description: 'Real-time messaging between teachers and students',
    icon: '💬',
  },
  {
    key: 'certificates',
    label: 'Certificates',
    description: 'Generate and issue completion certificates',
    icon: '🎓',
  },
  {
    key: 'exams',
    label: 'Exams & Quizzes',
    description: 'Online examination and quiz engine',
    icon: '📝',
  },
];

// ─── Toggle switch ────────────────────────────────────────────────────────────

interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}

function ToggleSwitch({ id, checked, onChange, label, disabled = false }: ToggleSwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
        'transition-colors duration-[var(--transition-base)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked
          ? 'bg-[var(--brand-primary)]'
          : 'bg-[var(--bg-surface-hover)] border border-[var(--border-default)]',
      )}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
        aria-hidden="true"
      />
    </button>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  description,
  children,
  delay = 0,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
    >
      <div className="border-b border-[var(--border-default)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {description && (
          <p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p>
        )}
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

// ─── Field ───────────────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  required?: boolean | undefined;
  error?: string | undefined;
  children: React.ReactNode;
}

function Field({ id, label, required, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium text-[var(--text-secondary)]"
      >
        {label}
        {required && (
          <span
            className="ml-0.5 text-[var(--error-solid)]"
            aria-hidden="true"
          >
            *
          </span>
        )}
      </label>
      {children}
      <AnimatePresence>
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-[var(--error-solid)]"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TenantConfigForm ─────────────────────────────────────────────────────────

export function TenantConfigForm({ initialConfig, onSave }: TenantConfigFormProps) {
  const [config, setConfig] = useState<TenantConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const uid = useId();

  // ── Field updater ──────────────────────────────────────────────────────────
  const updateField = <K extends keyof TenantConfig>(
    key: K,
    value: TenantConfig[K],
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSavedAt(null);
  };

  const toggleFeature = (key: keyof FeatureFlags) => {
    setConfig((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }));
    setSavedAt(null);
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const errs: Partial<Record<string, string>> = {};
    if (!config.academyName.trim())
      errs['academyName'] = 'Academy name is required.';
    if (
      config.logoUrl &&
      !/^https?:\/\/.+/i.test(config.logoUrl)
    )
      errs['logoUrl'] = 'Logo URL must start with http:// or https://';
    if (config.primaryColor && !/^#[0-9A-Fa-f]{6}$/.test(config.primaryColor))
      errs['primaryColor'] = 'Enter a valid hex color (e.g. #4F46E5).';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onSave(config);
      setSavedAt(new Date());
    } finally {
      setIsSaving(false);
    }
  };

  // ── Input class helper ─────────────────────────────────────────────────────
  const inputCls = (field: string) =>
    cn(
      'w-full min-h-[44px] rounded-lg border bg-[var(--bg-surface)] px-3 py-2.5',
      'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
      'focus:border-[var(--border-focus)] focus:outline-none',
      'focus:ring-2 focus:ring-[var(--border-focus)]',
      'transition-[border-color,box-shadow] duration-[var(--transition-fast)]',
      errors[field]
        ? 'border-[var(--error-solid)]'
        : 'border-[var(--border-default)]',
    );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="space-y-5"
      role="form"
      aria-label="Tenant configuration form"
    >

      {/* ── Academy Information ─────────────────────────────────────────────── */}
      <SectionCard
        title="Academy Information"
        description="Basic details visible to students and teachers"
        delay={0}
      >
        <div className="grid gap-4 sm:grid-cols-2">

          {/* Academy name */}
          <Field
            id={`${uid}-name`}
            label="Academy Name"
            required
            error={errors['academyName']}
          >
            <input
              id={`${uid}-name`}
              type="text"
              value={config.academyName}
              onChange={(e) => updateField('academyName', e.target.value)}
              placeholder="e.g. Bright Future Academy"
              aria-required="true"
              aria-invalid={!!errors['academyName']}
              aria-describedby={errors['academyName'] ? `${uid}-name-err` : undefined}
              className={inputCls('academyName')}
            />
          </Field>

          {/* Timezone */}
          <Field id={`${uid}-tz`} label="Timezone">
            <select
              id={`${uid}-tz`}
              value={config.timezone}
              onChange={(e) => updateField('timezone', e.target.value)}
              className={inputCls('timezone')}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </Field>

          {/* Currency */}
          <Field id={`${uid}-currency`} label="Default Currency">
            <select
              id={`${uid}-currency`}
              value={config.currency}
              onChange={(e) => updateField('currency', e.target.value)}
              className={inputCls('currency')}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>

          {/* Primary color */}
          <Field
            id={`${uid}-color`}
            label="Brand Color"
            error={errors['primaryColor']}
          >
            <div className="flex items-center gap-2">
              <input
                id={`${uid}-color-picker`}
                type="color"
                value={config.primaryColor}
                onChange={(e) => updateField('primaryColor', e.target.value)}
                className={cn(
                  'h-11 w-14 shrink-0 cursor-pointer rounded-lg border p-1',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]',
                  errors['primaryColor']
                    ? 'border-[var(--error-solid)]'
                    : 'border-[var(--border-default)]',
                )}
                aria-label="Pick brand color"
              />
              <input
                id={`${uid}-color`}
                type="text"
                value={config.primaryColor}
                onChange={(e) => updateField('primaryColor', e.target.value)}
                placeholder="#4F46E5"
                aria-invalid={!!errors['primaryColor']}
                aria-describedby={errors['primaryColor'] ? `${uid}-color-err` : undefined}
                className={cn(inputCls('primaryColor'), 'font-mono')}
                maxLength={7}
              />
            </div>
          </Field>

          {/* Logo URL — full width */}
          <div className="sm:col-span-2">
            <Field
              id={`${uid}-logo`}
              label="Logo URL"
              error={errors['logoUrl']}
            >
              <input
                id={`${uid}-logo`}
                type="url"
                value={config.logoUrl ?? ''}
                onChange={(e) =>
                  updateField('logoUrl', e.target.value || null)
                }
                placeholder="https://example.com/logo.png"
                aria-invalid={!!errors['logoUrl']}
                aria-describedby={errors['logoUrl'] ? `${uid}-logo-err` : undefined}
                className={inputCls('logoUrl')}
              />
            </Field>
          </div>

          {/* Logo preview */}
          <AnimatePresence>
            {config.logoUrl && !errors['logoUrl'] && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="sm:col-span-2 flex items-center gap-3"
              >
                <span className="text-xs text-[var(--text-muted)]">Preview:</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={config.logoUrl}
                  alt="Academy logo preview"
                  className="h-10 max-w-[120px] rounded-lg border border-[var(--border-default)] object-contain p-1"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SectionCard>

      {/* ── Feature Flags ───────────────────────────────────────────────────── */}
      <SectionCard
        title="Feature Flags"
        description="Toggle modules on or off for this academy"
        delay={0.06}
      >
        <div className="space-y-4">
          {FEATURE_FLAGS.map((flag) => {
            const isEnabled = config.features[flag.key];
            return (
              <motion.div
                key={flag.key}
                whileHover={{ x: 1 }}
                transition={{ duration: 0.15 }}
                className="flex items-start gap-4"
              >
                {/* Icon */}
                <span
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg',
                    'transition-colors duration-[var(--transition-base)]',
                    isEnabled
                      ? 'bg-[var(--brand-primary)] bg-opacity-10'
                      : 'bg-[var(--bg-surface-secondary)]',
                  )}
                  aria-hidden="true"
                >
                  {flag.icon}
                </span>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {flag.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    {flag.description}
                  </p>
                </div>

                {/* Toggle */}
                <div className="shrink-0 pt-0.5">
                  <ToggleSwitch
                    id={`${uid}-flag-${flag.key}`}
                    checked={isEnabled}
                    onChange={() => toggleFeature(flag.key)}
                    label={`${isEnabled ? 'Disable' : 'Enable'} ${flag.label}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </SectionCard>

      {/* ── Save bar ────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.12 }}
        className={cn(
          'flex flex-col gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)]',
          'px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        )}
      >
        {/* Status message */}
        <div aria-live="polite" aria-atomic="true">
          <AnimatePresence mode="wait">
            {savedAt ? (
              <motion.p
                key="saved"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 text-xs font-medium text-[var(--success-text)]"
              >
                <span aria-hidden="true">✅</span>
                Saved at{' '}
                {savedAt.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </motion.p>
            ) : (
              <motion.p
                key="info"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-xs text-[var(--text-muted)]"
              >
                Changes will apply immediately after saving.
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <motion.button
            type="button"
            onClick={() => {
              setConfig(initialConfig);
              setErrors({});
              setSavedAt(null);
            }}
            disabled={isSaving}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'w-full sm:w-auto min-h-[44px] rounded-xl border border-[var(--border-default)] px-5 py-2.5',
              'text-sm font-medium text-[var(--text-secondary)]',
              'hover:bg-[var(--bg-surface-hover)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
              'disabled:opacity-50 transition-colors',
            )}
            aria-label="Reset form to initial values"
          >
            Reset
          </motion.button>

          <motion.button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'w-full sm:w-auto min-h-[44px] rounded-xl bg-[var(--brand-primary)] px-6 py-2.5',
              'text-sm font-semibold text-white',
              'hover:bg-[var(--brand-primary-hover)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
              'disabled:cursor-not-allowed disabled:opacity-60',
              'transition-[background-color,opacity] duration-[var(--transition-base)]',
            )}
            aria-busy={isSaving}
            aria-label={isSaving ? 'Saving configuration…' : 'Save configuration changes'}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"
                  aria-hidden="true"
                />
                Saving…
              </span>
            ) : (
              'Save Changes'
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}