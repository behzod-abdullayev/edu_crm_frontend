'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SystemConfig, SystemHealth, GlobalFeatureFlags } from '../types/owner.types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SystemConfigPanelProps {
  config: SystemConfig;
  health: SystemHealth;
  apiVersion: string;
  onSaveConfig:    (config: SystemConfig) => Promise<void>;
  onClearCache:    () => Promise<void>;
  onTriggerBackup: () => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FEATURE_FLAG_LABELS: Record<keyof GlobalFeatureFlags, string> = {
  payments:     'Payments Module',
  chat:         'Chat & Messaging',
  certificates: 'Certificates',
  exams:        'Exams & Quizzes',
  analytics:    'Analytics Dashboard',
};

const FEATURE_FLAG_DESCRIPTIONS: Record<keyof GlobalFeatureFlags, string> = {
  payments:     'Billing, invoices, and debt management',
  chat:         'Real-time messaging between users',
  certificates: 'Issue and download completion certificates',
  exams:        'Online exam and quiz engine',
  analytics:    'Advanced analytics and reports',
};

// ─── Animation variants ───────────────────────────────────────────────────────

const sectionVariants = {
  hidden:  { opacity: 0, y: 14 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.28, ease: 'easeOut' },
  }),
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface AnimatedToggleProps {
  checked: boolean;
  onChange: () => void;
  id: string;
  label: string;
  danger?: boolean;
}

function AnimatedToggle({ checked, onChange, id, label, danger = false }: AnimatedToggleProps) {
  return (
    <motion.button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className="relative h-7 w-14 flex-shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2"
      style={{
        background: checked
          ? danger
            ? 'var(--error-solid)'
            : 'var(--brand-primary)'
          : 'var(--bg-surface-hover)',
      }}
      animate={{
        background: checked
          ? danger
            ? 'var(--error-solid)'
            : 'var(--brand-primary)'
          : 'var(--bg-surface-hover)',
      }}
      transition={{ duration: 0.2 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.span
        className="absolute top-1.5 h-4 w-4 rounded-full bg-white shadow-sm"
        animate={{ x: checked ? 26 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        aria-hidden="true"
      />
    </motion.button>
  );
}

interface SectionCardProps {
  children: React.ReactNode;
  index?: number;
  className?: string;
  danger?: boolean;
}

function SectionCard({ children, index = 0, className = '', danger = false }: SectionCardProps) {
  return (
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className={`rounded-xl border p-5 sm:p-6 ${className}`}
      style={{
        background:   'var(--bg-surface)',
        borderColor:  danger ? 'var(--error-border)' : 'var(--border-default)',
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Maintenance Mode Section ─────────────────────────────────────────────────

interface MaintenanceSectionProps {
  isEnabled: boolean;
  onToggle: () => void;
}

function MaintenanceSection({ isEnabled, onToggle }: MaintenanceSectionProps) {
  return (
    <motion.div
      className="rounded-xl border p-5 sm:p-6 transition-colors duration-300"
      style={{
        background:  isEnabled ? 'var(--error-bg)'     : 'var(--bg-surface)',
        borderColor: isEnabled ? 'var(--error-border)' : 'var(--border-default)',
      }}
      animate={{
        borderColor: isEnabled ? 'var(--error-border)' : 'var(--border-default)',
      }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3
            className="text-sm font-semibold"
            style={{ color: isEnabled ? 'var(--error-text)' : 'var(--text-primary)' }}
          >
            Maintenance Mode
          </h3>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {isEnabled
              ? '⚠️ System is in maintenance mode — all users except owners are locked out'
              : 'Enable to temporarily restrict all access for maintenance'}
          </p>
        </div>
        <AnimatedToggle
          checked={isEnabled}
          onChange={onToggle}
          id="maintenance-toggle"
          label="Toggle maintenance mode"
          danger
        />
      </div>

      <AnimatePresence>
        {isEnabled && (
          <motion.div
            className="mt-4 flex items-start gap-2 rounded-lg p-3"
            style={{ background: 'var(--error-bg)', borderColor: 'var(--error-border)' }}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span aria-hidden="true" className="text-base leading-none mt-0.5">🔒</span>
            <p className="text-xs" style={{ color: 'var(--error-text)' }}>
              Students, teachers, and admins will see a maintenance page. Only owner accounts
              can access the platform.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Feature Flags Section ────────────────────────────────────────────────────

interface FeatureFlagsSectionProps {
  flags: GlobalFeatureFlags;
  onToggle: (key: keyof GlobalFeatureFlags) => void;
}

function FeatureFlagsSection({ flags, onToggle }: FeatureFlagsSectionProps) {
  return (
    <SectionCard index={2}>
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        Global Feature Flags
      </h3>
      <p className="mt-0.5 mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        These settings apply to all tenants and branches
      </p>

      <div className="space-y-3">
        {(Object.keys(flags) as (keyof GlobalFeatureFlags)[]).map((key, i) => (
          <motion.div
            key={key}
            className="flex items-center justify-between gap-4 rounded-lg p-3"
            style={{
              background:  'var(--bg-surface-secondary)',
              borderColor: 'var(--border-default)',
            }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.22 }}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {FEATURE_FLAG_LABELS[key]}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {FEATURE_FLAG_DESCRIPTIONS[key]}
              </p>
            </div>
            <AnimatedToggle
              checked={flags[key]}
              onChange={() => onToggle(key)}
              id={`flag-${key}`}
              label={`Toggle ${FEATURE_FLAG_LABELS[key]}`}
            />
          </motion.div>
        ))}
      </div>
    </SectionCard>
  );
}

// ─── SMTP Section ─────────────────────────────────────────────────────────────

interface SmtpSectionProps {
  host:     string;
  port:     number;
  user:     string;
  secure:   boolean;
  onChange: <K extends keyof SystemConfig['emailSmtp']>(
    field: K,
    value: SystemConfig['emailSmtp'][K],
  ) => void;
}

function SmtpSection({ host, port, user, secure, onChange }: SmtpSectionProps) {
  const inputClass =
    'w-full rounded-lg border px-3 py-2.5 text-sm min-h-[44px] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-1';

  return (
    <SectionCard index={3}>
      <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
        Email SMTP Configuration
      </h3>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Host */}
        <div className="space-y-1.5">
          <label
            htmlFor="smtp-host"
            className="block text-xs font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            SMTP Host
          </label>
          <input
            id="smtp-host"
            type="text"
            value={host}
            onChange={(e) => onChange('host', e.target.value)}
            placeholder="smtp.gmail.com"
            className={inputClass}
            style={{
              background:  'var(--bg-surface-secondary)',
              borderColor: 'var(--border-default)',
              color:       'var(--text-primary)',
            }}
          />
        </div>

        {/* Port */}
        <div className="space-y-1.5">
          <label
            htmlFor="smtp-port"
            className="block text-xs font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            Port
          </label>
          <input
            id="smtp-port"
            type="number"
            inputMode="numeric"
            value={port}
            onChange={(e) => onChange('port', Number(e.target.value))}
            placeholder="587"
            className={inputClass}
            style={{
              background:  'var(--bg-surface-secondary)',
              borderColor: 'var(--border-default)',
              color:       'var(--text-primary)',
            }}
          />
        </div>

        {/* User */}
        <div className="space-y-1.5 sm:col-span-2">
          <label
            htmlFor="smtp-user"
            className="block text-xs font-medium"
            style={{ color: 'var(--text-secondary)' }}
          >
            SMTP User (email)
          </label>
          <input
            id="smtp-user"
            type="email"
            inputMode="email"
            value={user}
            onChange={(e) => onChange('user', e.target.value)}
            placeholder="noreply@academy.com"
            className={inputClass}
            style={{
              background:  'var(--bg-surface-secondary)',
              borderColor: 'var(--border-default)',
              color:       'var(--text-primary)',
            }}
          />
        </div>

        {/* SSL toggle */}
        <div className="flex items-center gap-3 sm:col-span-2">
          <AnimatedToggle
            checked={secure}
            onChange={() => onChange('secure', !secure)}
            id="smtp-secure"
            label="Toggle SSL/TLS"
          />
          <label
            htmlFor="smtp-secure"
            className="cursor-pointer text-sm"
            style={{ color: 'var(--text-primary)' }}
          >
            Use SSL / TLS (recommended for port 465)
          </label>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Action Bar ───────────────────────────────────────────────────────────────

interface ActionBarProps {
  isSaving:       boolean;
  isClearingCache: boolean;
  isBackingUp:    boolean;
  savedAt:        Date | null;
  onSave:         () => void;
  onClearCache:   () => void;
  onBackup:       () => void;
}

function ActionBar({
  isSaving,
  isClearingCache,
  isBackingUp,
  savedAt,
  onSave,
  onClearCache,
  onBackup,
}: ActionBarProps) {
  return (
    <motion.div
      className="flex flex-wrap items-center gap-3 pt-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.35, duration: 0.25 }}
    >
      {/* Save */}
      <motion.button
        type="button"
        onClick={onSave}
        disabled={isSaving}
        aria-label="Save configuration changes"
        aria-busy={isSaving}
        className="rounded-lg px-6 py-2.5 text-sm font-semibold min-h-[44px] text-white disabled:opacity-50"
        style={{ background: 'var(--brand-primary)' }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
      >
        {isSaving ? (
          <span className="flex items-center gap-2">
            <motion.span
              className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
              aria-hidden="true"
            />
            Saving…
          </span>
        ) : (
          'Save Configuration'
        )}
      </motion.button>

      {/* Clear cache */}
      <motion.button
        type="button"
        onClick={onClearCache}
        disabled={isClearingCache}
        aria-label="Clear application cache"
        aria-busy={isClearingCache}
        className="rounded-lg border px-4 py-2.5 text-sm font-medium min-h-[44px] disabled:opacity-50 transition-colors hover:bg-[var(--bg-surface-hover)]"
        style={{
          borderColor: 'var(--border-default)',
          color:       'var(--text-primary)',
          background:  'var(--bg-surface)',
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
      >
        {isClearingCache ? 'Clearing…' : 'Clear Cache'}
      </motion.button>

      {/* Backup */}
      <motion.button
        type="button"
        onClick={onBackup}
        disabled={isBackingUp}
        aria-label="Trigger database backup"
        aria-busy={isBackingUp}
        className="rounded-lg border px-4 py-2.5 text-sm font-medium min-h-[44px] disabled:opacity-50 transition-colors hover:bg-[var(--bg-surface-hover)]"
        style={{
          borderColor: 'var(--border-default)',
          color:       'var(--text-primary)',
          background:  'var(--bg-surface)',
        }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.97 }}
      >
        {isBackingUp ? 'Backing up…' : 'Trigger Backup'}
      </motion.button>

      {/* Save timestamp */}
      <AnimatePresence>
        {savedAt !== null && (
          <motion.span
            className="flex items-center gap-1.5 text-xs"
            style={{ color: 'var(--success-text)' }}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="status"
            aria-live="polite"
          >
            <span aria-hidden="true">✓</span>
            Saved at {savedAt.toLocaleTimeString()}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmMaintenanceProps {
  onConfirm: () => void;
  onCancel:  () => void;
}

function ConfirmMaintenanceDialog({ onConfirm, onCancel }: ConfirmMaintenanceProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
      style={{ background: 'var(--bg-overlay)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="maintenance-confirm-title"
      aria-describedby="maintenance-confirm-desc"
    >
      <motion.div
        className="w-full max-w-md rounded-2xl border p-6 shadow-xl"
        style={{
          background:  'var(--bg-surface)',
          borderColor: 'var(--error-border)',
        }}
        initial={{ scale: 0.95, y: 24 }}
        animate={{ scale: 1,    y: 0  }}
        exit={{ scale: 0.95,    y: 24 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-full text-2xl"
          style={{ background: 'var(--error-bg)' }}
          aria-hidden="true"
        >
          ⚠️
        </div>

        <h3
          id="maintenance-confirm-title"
          className="mb-2 text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Enable Maintenance Mode?
        </h3>
        <p
          id="maintenance-confirm-desc"
          className="mb-6 text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          This will immediately lock out all users except owners. Students, teachers, and admins
          will see a maintenance page until you disable this mode.
        </p>

        <div className="flex gap-3">
          <motion.button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold min-h-[44px] text-white"
            style={{ background: 'var(--error-solid)' }}
            whileTap={{ scale: 0.97 }}
          >
            Enable Maintenance
          </motion.button>
          <motion.button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border py-2.5 text-sm font-medium min-h-[44px] transition-colors hover:bg-[var(--bg-surface-hover)]"
            style={{
              borderColor: 'var(--border-default)',
              color:       'var(--text-primary)',
            }}
            whileTap={{ scale: 0.97 }}
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function SystemConfigPanel({
  config,
  health: _health,
  apiVersion: _apiVersion,
  onSaveConfig,
  onClearCache,
  onTriggerBackup,
}: SystemConfigPanelProps) {
  const [local,               setLocal]               = useState<SystemConfig>(config);
  const [confirmMaintenance,  setConfirmMaintenance]  = useState(false);
  const [isSaving,            setIsSaving]            = useState(false);
  const [isClearingCache,     setIsClearingCache]     = useState(false);
  const [isBackingUp,         setIsBackingUp]         = useState(false);
  const [savedAt,             setSavedAt]             = useState<Date | null>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleMaintenanceToggle = () => {
    if (!local.maintenanceMode) {
      setConfirmMaintenance(true);
    } else {
      setLocal((prev) => ({ ...prev, maintenanceMode: false }));
    }
  };

  const confirmEnableMaintenance = () => {
    setLocal((prev) => ({ ...prev, maintenanceMode: true }));
    setConfirmMaintenance(false);
  };

  const toggleFeatureFlag = (key: keyof GlobalFeatureFlags) => {
    setLocal((prev) => ({
      ...prev,
      featureFlags: { ...prev.featureFlags, [key]: !prev.featureFlags[key] },
    }));
  };

  const handleSmtpChange = <K extends keyof SystemConfig['emailSmtp']>(
    field: K,
    value: SystemConfig['emailSmtp'][K],
  ) => {
    setLocal((prev) => ({
      ...prev,
      emailSmtp: { ...prev.emailSmtp, [field]: value },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveConfig(local);
      setSavedAt(new Date());
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearingCache(true);
    try {
      await onClearCache();
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      await onTriggerBackup();
    } finally {
      setIsBackingUp(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* 1. Maintenance Mode */}
      <MaintenanceSection
        isEnabled={local.maintenanceMode}
        onToggle={handleMaintenanceToggle}
      />

      {/* 2. Feature Flags */}
      <FeatureFlagsSection
        flags={local.featureFlags}
        onToggle={toggleFeatureFlag}
      />

      {/* 3. SMTP */}
      <SmtpSection
        host={local.emailSmtp.host}
        port={local.emailSmtp.port}
        user={local.emailSmtp.user}
        secure={local.emailSmtp.secure}
        onChange={handleSmtpChange}
      />

      {/* 4. Action bar */}
      <ActionBar
        isSaving={isSaving}
        isClearingCache={isClearingCache}
        isBackingUp={isBackingUp}
        savedAt={savedAt}
        onSave={handleSave}
        onClearCache={handleClearCache}
        onBackup={handleBackup}
      />

      {/* Confirmation dialog */}
      <AnimatePresence>
        {confirmMaintenance && (
          <ConfirmMaintenanceDialog
            onConfirm={confirmEnableMaintenance}
            onCancel={() => setConfirmMaintenance(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}