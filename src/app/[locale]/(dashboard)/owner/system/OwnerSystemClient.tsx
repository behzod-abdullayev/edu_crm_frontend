'use client';
// src/app/[locale]/(dashboard)/owner/system/OwnerSystemClient.tsx
//
// XATO 1 FIX: Backend TenantRow → SystemConfig mapper ishlatiladi (owner.mapper.ts)
// XATO 2 FIX: PATCH so'rovida faqat featureFlags yuboriladi (mapSystemConfigToDto)
// XATO 3 FIX: /system/cache va /system/backup endpointlari backend da yo'q —
//             tugmalar "not supported" toast bilan ishlaydi, silent fail emas
// XATO 4 FIX: Danger Zone tugmalari confirm dialog + toast bilan ishlaydi
// XATO 5 FIX: Raw fetch + useState → useSystemConfig + useSaveSystemConfig (TanStack Query)
// XATO 7 FIX: useTranslations() orqali i18n (hardcoded string emas)
//
// ✅ Zero `any` types
// ✅ Framer Motion: section stagger, toggle animate, button press, health pulse
// ✅ Responsive: 1 col mobile / 2-4 col desktop
// ✅ Light/dark via CSS variables only
// ✅ ARIA: role="switch", aria-checked, role="alertdialog", role="status"

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { SystemConfigPanel } from '@/modules/owner/components/SystemConfigPanel';
import {
  useSystemConfig,
  useSaveSystemConfig,
} from '@/services/query/owner.queries';
import { useUIStore } from '@/store/ui.store';
import type { SystemConfig, SystemHealth } from '@/modules/owner/types/owner.types';
import { cn } from '@/shared/utils/cn';

// ─── Safe defaults ────────────────────────────────────────────────────────────

const DEFAULT_HEALTH: SystemHealth = {
  status: 'healthy',
  apiVersion: '1.0.0',
  dbStatus: 'connected',
  cacheStatus: 'connected',
  uptime: 0,
  services: [],
  timestamp: new Date(0).toISOString(),
};

const DEFAULT_CONFIG: SystemConfig = {
  maintenanceMode: false,
  featureFlags: {
    payments: true,
    chat: true,
    certificates: true,
    exams: true,
    analytics: true,
  },
  emailSmtp: {
    host: '',
    port: 587,
    user: '',
    password: '',
    secure: false,
  },
  registrationEnabled: true,
  maxStudentsPerClass: 30,
  defaultCurrency: 'USD',
  timezone: 'UTC',
  supportEmail: '',
};

// ─── Health indicator ─────────────────────────────────────────────────────────

interface HealthIndicatorProps {
  label: string;
  value: string;
  isOk: boolean;
  index: number;
}

function HealthIndicator({ label, value, isOk, index }: HealthIndicatorProps) {
  return (
    <motion.div
      className="rounded-xl border p-4"
      style={{
        background: 'var(--bg-surface)',
        borderColor: isOk ? 'var(--success-border)' : 'var(--error-border)',
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.25 }}
    >
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <motion.span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{
            background: isOk ? 'var(--success-solid)' : 'var(--error-solid)',
          }}
          animate={isOk ? { scale: [1, 1.3, 1] } : { scale: 1 }}
          transition={{ duration: 1.5, repeat: Infinity }}
          aria-hidden="true"
        />
        <span
          className="text-sm font-semibold capitalize"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Action button ────────────────────────────────────────────────────────────

interface SysActionBtnProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  variant?: 'danger' | 'default';
  ariaLabel: string;
}

function SysActionBtn({
  onClick,
  disabled,
  loading,
  children,
  variant = 'default',
  ariaLabel,
}: SysActionBtnProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled ?? loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={cn(
        'rounded-lg px-4 py-2.5 text-sm font-medium min-h-[44px] transition-colors disabled:opacity-50',
        variant === 'danger'
          ? 'text-white'
          : 'border text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
      )}
      style={
        variant === 'danger'
          ? { background: 'var(--error-solid)', borderColor: 'transparent' }
          : {
              borderColor: 'var(--border-default)',
              background: 'var(--bg-surface)',
            }
      }
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.01 }}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <motion.span
            className="w-4 h-4 rounded-full border-2 border-current border-t-transparent inline-block"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
            aria-hidden="true"
          />
          {children}
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}

// ─── Confirm dialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  dangerous?: boolean;
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  dangerous = false,
}: ConfirmDialogProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
      style={{ background: 'var(--bg-overlay)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
      role="alertdialog"
      aria-modal="true"
      aria-label={title}
    >
      <motion.div
        className="w-full max-w-md rounded-2xl border p-6 shadow-xl"
        style={{
          background: 'var(--bg-surface)',
          borderColor: dangerous ? 'var(--error-border)' : 'var(--border-default)',
        }}
        initial={{ scale: 0.95, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 24 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        {dangerous && (
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-4"
            style={{ background: 'var(--error-bg)' }}
            aria-hidden="true"
          >
            ⚠️
          </div>
        )}
        <h3
          className="text-lg font-semibold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          {description}
        </p>
        <div className="flex gap-3">
          <motion.button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-lg py-2.5 text-sm font-semibold min-h-[44px] text-white"
            style={{
              background: dangerous ? 'var(--error-solid)' : 'var(--brand-primary)',
            }}
            whileTap={{ scale: 0.97 }}
          >
            {confirmLabel}
          </motion.button>
          <motion.button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border py-2.5 text-sm font-medium min-h-[44px]"
            style={{
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
            whileTap={{ scale: 0.97 }}
          >
            {cancelLabel}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function SystemSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading system config…">
      {/* Health cards skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-20 rounded-xl animate-pulse"
            style={{ background: 'var(--bg-surface-hover)' }}
          />
        ))}
      </div>
      {/* Config sections skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border p-6 animate-pulse"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
            height: 120,
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

// ─── Main client ──────────────────────────────────────────────────────────────

export function OwnerSystemClient() {
  // XATO 5 FIX: TanStack Query hooks (raw fetch + useState yerine)
  const { data: config, isLoading, isError, error } = useSystemConfig();
  const saveConfigMutation = useSaveSystemConfig();
  const { addToast } = useUIStore();

  // XATO 7 FIX: i18n translations
  const t = useTranslations('owner.system');

  // Dialog states
  const [showCacheConfirm, setShowCacheConfirm] = useState(false);
  const [showBackupConfirm, setShowBackupConfirm] = useState(false);
  const [showResetFlagsConfirm, setShowResetFlagsConfirm] = useState(false);
  const [showForceLogoutConfirm, setShowForceLogoutConfirm] = useState(false);

  // Action states
  const [cacheCleared, setCacheCleared] = useState(false);
  const [backupTriggered, setBackupTriggered] = useState(false);

  // Health is static for now (derived from config load success/failure)
  const health: SystemHealth = {
    status: isError ? 'degraded' : 'healthy',
    apiVersion: '1.0.0',
    dbStatus: 'connected',
    cacheStatus: 'connected',
    uptime: 0,
    services: [],
    timestamp: new Date().toISOString(),
  };

  // XATO 5 FIX: saveConfig TanStack Query mutation ishlatadi
  const handleSaveConfig = async (cfg: SystemConfig): Promise<void> => {
    await saveConfigMutation.mutateAsync(cfg);
  };

  // XATO 3 FIX: /system/cache endpoint backendda yo'q — toast bilan xabar beramiz
  const handleClearCache = async () => {
    setShowCacheConfirm(false);
    try {
      const res = await fetch('/api/owner/system/cache', { method: 'DELETE' });
      if (res.ok) {
        setCacheCleared(true);
        setTimeout(() => setCacheCleared(false), 5000);
        addToast({ type: 'success', title: t('actions.cacheClearedSuccess') });
      } else {
        // XATO 3 FIX: 404 kelsa — "not supported" xabarini ko'rsatamiz (silent fail emas)
        addToast({
          type: 'warning',
          title: t('actions.cacheNotSupported'),
        });
      }
    } catch {
      addToast({
        type: 'warning',
        title: t('actions.cacheNotSupported'),
      });
    }
  };

  // XATO 3 FIX: /system/backup endpoint backendda yo'q — toast bilan xabar beramiz
  const handleTriggerBackup = async () => {
    setShowBackupConfirm(false);
    try {
      const res = await fetch('/api/owner/system/backup', { method: 'POST' });
      if (res.ok) {
        setBackupTriggered(true);
        setTimeout(() => setBackupTriggered(false), 5000);
        addToast({ type: 'success', title: t('actions.backupTriggeredSuccess') });
      } else {
        // XATO 3 FIX: 404 kelsa — "not supported" xabarini ko'rsatamiz
        addToast({
          type: 'warning',
          title: t('actions.backupNotSupported'),
        });
      }
    } catch {
      addToast({
        type: 'warning',
        title: t('actions.backupNotSupported'),
      });
    }
  };

  // XATO 4 FIX: Reset Flags — confirm dialog + toast (no-op emas)
  const handleResetFlags = async () => {
    setShowResetFlagsConfirm(false);
    try {
      const res = await fetch('/api/owner/system/reset-flags', { method: 'POST' });
      if (res.ok) {
        addToast({ type: 'success', title: t('dangerZone.resetFlagsSuccess') });
      } else {
        // Backend endpoint yo'q — xabar ko'rsatamiz
        addToast({
          type: 'warning',
          title: t('dangerZone.resetFlagsNotSupported'),
        });
      }
    } catch {
      addToast({
        type: 'warning',
        title: t('dangerZone.resetFlagsNotSupported'),
      });
    }
  };

  // XATO 4 FIX: Force Logout All — confirm dialog + toast (no-op emas)
  const handleForceLogout = async () => {
    setShowForceLogoutConfirm(false);
    try {
      const res = await fetch('/api/owner/system/force-logout', { method: 'POST' });
      if (res.ok) {
        addToast({ type: 'success', title: t('dangerZone.forceLogoutSuccess') });
      } else {
        // Backend endpoint yo'q — xabar ko'rsatamiz
        addToast({
          type: 'warning',
          title: t('dangerZone.forceLogoutNotSupported'),
        });
      }
    } catch {
      addToast({
        type: 'warning',
        title: t('dangerZone.forceLogoutNotSupported'),
      });
    }
  };

  const errorMessage =
    error instanceof Error ? error.message : 'Failed to load system config';

  const displayConfig = config ?? DEFAULT_CONFIG;

  return (
    <div className="space-y-8 pb-8" style={{ padding: 'var(--space-6)' }}>
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        {/* XATO 7 FIX: t() orqali tarjima */}
        <h1
          className="text-2xl font-bold sm:text-3xl"
          style={{ color: 'var(--text-primary)' }}
        >
          {t('pageTitle')}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {t('pageDesc')}
        </p>
      </motion.div>

      {/* ── Load error banner ────────────────────────────────────────────── */}
      <AnimatePresence>
        {isError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            role="alert"
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3 text-sm',
              'border-[var(--warning-border)] bg-[var(--warning-bg)] text-[var(--warning-text)]',
            )}
          >
            <span>⚠️</span>
            <span>
              {t('errorBanner')}{' '}
              <span className="opacity-70 text-xs">({errorMessage})</span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Health dashboard ──────────────────────────────────────────── */}
      <motion.section
        aria-label={t('health.title')}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('health.title')}
          </h2>
          {!isLoading && (
            <span
              className="text-xs font-medium rounded-full px-3 py-1"
              style={{
                background:
                  health.status === 'healthy'
                    ? 'var(--success-bg)'
                    : health.status === 'degraded'
                    ? 'var(--warning-bg)'
                    : 'var(--error-bg)',
                color:
                  health.status === 'healthy'
                    ? 'var(--success-text)'
                    : health.status === 'degraded'
                    ? 'var(--warning-text)'
                    : 'var(--error-text)',
              }}
              role="status"
              aria-live="polite"
            >
              {health.status === 'healthy'
                ? `● ${t('health.allOperational')}`
                : health.status === 'degraded'
                ? `● ${t('health.degraded')}`
                : `● ${t('health.disruption')}`}
            </span>
          )}
        </div>

        {isLoading ? (
          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            aria-busy="true"
            aria-hidden="true"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-xl animate-pulse"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <HealthIndicator
              label={t('health.apiStatus')}
              value={health.status}
              isOk={health.status === 'healthy'}
              index={0}
            />
            <HealthIndicator
              label={t('health.database')}
              value={health.dbStatus}
              isOk={health.dbStatus === 'connected'}
              index={1}
            />
            <HealthIndicator
              label={t('health.cache')}
              value={health.cacheStatus}
              isOk={health.cacheStatus === 'connected'}
              index={2}
            />
            <HealthIndicator
              label={t('health.uptime')}
              value={`${Math.floor(health.uptime / 3600)}h ${Math.floor(
                (health.uptime % 3600) / 60,
              )}m`}
              isOk
              index={3}
            />
          </div>
        )}
      </motion.section>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <motion.section
        aria-label={t('actions.title')}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.1 }}
      >
        <h2
          className="text-sm font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          {t('actions.title')}
        </h2>

        <div
          className="rounded-xl border p-5 flex flex-wrap gap-3"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
          }}
        >
          {/* XATO 3 FIX: Confirm dialog + toast (silent fail emas) */}
          <SysActionBtn
            onClick={() => setShowCacheConfirm(true)}
            ariaLabel={t('actions.clearCacheAriaLabel')}
          >
            {cacheCleared ? `✓ ${t('actions.cacheClearedLabel')}` : `🗑 ${t('actions.clearCache')}`}
          </SysActionBtn>

          <SysActionBtn
            onClick={() => setShowBackupConfirm(true)}
            ariaLabel={t('actions.triggerBackupAriaLabel')}
          >
            {backupTriggered ? `✓ ${t('actions.backupTriggeredLabel')}` : `💾 ${t('actions.triggerBackup')}`}
          </SysActionBtn>

          <SysActionBtn
            onClick={() => window.location.reload()}
            ariaLabel={t('actions.refreshAriaLabel')}
          >
            🔄 {t('actions.refreshStatus')}
          </SysActionBtn>
        </div>
      </motion.section>

      {/* ── System Config Panel ──────────────────────────────────────────── */}
      <motion.section
        aria-label={t('configuration')}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        <h2
          className="text-sm font-semibold mb-4"
          style={{ color: 'var(--text-primary)' }}
        >
          {t('configuration')}
        </h2>

        {isLoading ? (
          <SystemSkeleton />
        ) : (
          // XATO 1 FIX: config mapper orqali keladi, hech qachon undefined bo'lmaydi
          <SystemConfigPanel
            config={displayConfig}
            health={health ?? DEFAULT_HEALTH}
            apiVersion={health.apiVersion}
            onSaveConfig={handleSaveConfig}
            onClearCache={handleClearCache}
            onTriggerBackup={handleTriggerBackup}
          />
        )}
      </motion.section>

      {/* ── Danger zone ──────────────────────────────────────────────────── */}
      <motion.section
        aria-label={t('dangerZone.title')}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.3 }}
      >
        <h2
          className="text-sm font-semibold mb-4"
          style={{ color: 'var(--error-text)' }}
        >
          ⚠️ {t('dangerZone.title')}
        </h2>
        <div
          className="rounded-xl border p-5 space-y-4"
          style={{
            borderColor: 'var(--error-border)',
            background: 'var(--error-bg)',
          }}
        >
          {/* Reset Flags — XATO 4 FIX: no-op emas, confirm dialog + toast */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--error-text)' }}
              >
                {t('dangerZone.resetFlags')}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {t('dangerZone.resetFlagsDesc')}
              </p>
            </div>
            <SysActionBtn
              onClick={() => setShowResetFlagsConfirm(true)}
              ariaLabel={t('dangerZone.resetFlagsAriaLabel')}
              variant="danger"
            >
              {t('dangerZone.resetFlagsBtn')}
            </SysActionBtn>
          </div>

          {/* Force Logout — XATO 4 FIX: no-op emas, confirm dialog + toast */}
          <div
            className="border-t pt-4 flex flex-wrap items-start justify-between gap-4"
            style={{ borderColor: 'var(--error-border)' }}
          >
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: 'var(--error-text)' }}
              >
                {t('dangerZone.forceLogout')}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                {t('dangerZone.forceLogoutDesc')}
              </p>
            </div>
            <SysActionBtn
              onClick={() => setShowForceLogoutConfirm(true)}
              ariaLabel={t('dangerZone.forceLogoutAriaLabel')}
              variant="danger"
            >
              {t('dangerZone.forceLogoutBtn')}
            </SysActionBtn>
          </div>
        </div>
      </motion.section>

      {/* ── Confirm dialogs ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCacheConfirm && (
          <ConfirmDialog
            title={t('actions.clearCacheConfirmTitle')}
            description={t('actions.clearCacheConfirmDesc')}
            confirmLabel={t('actions.clearCache')}
            cancelLabel={t('cancel')}
            onConfirm={handleClearCache}
            onCancel={() => setShowCacheConfirm(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBackupConfirm && (
          <ConfirmDialog
            title={t('actions.backupConfirmTitle')}
            description={t('actions.backupConfirmDesc')}
            confirmLabel={t('actions.triggerBackup')}
            cancelLabel={t('cancel')}
            onConfirm={handleTriggerBackup}
            onCancel={() => setShowBackupConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* XATO 4 FIX: Danger Zone confirm dialogs */}
      <AnimatePresence>
        {showResetFlagsConfirm && (
          <ConfirmDialog
            title={t('dangerZone.resetFlagsConfirmTitle')}
            description={t('dangerZone.resetFlagsConfirmDesc')}
            confirmLabel={t('dangerZone.resetFlagsBtn')}
            cancelLabel={t('cancel')}
            onConfirm={handleResetFlags}
            onCancel={() => setShowResetFlagsConfirm(false)}
            dangerous
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForceLogoutConfirm && (
          <ConfirmDialog
            title={t('dangerZone.forceLogoutConfirmTitle')}
            description={t('dangerZone.forceLogoutConfirmDesc')}
            confirmLabel={t('dangerZone.forceLogoutBtn')}
            cancelLabel={t('cancel')}
            onConfirm={handleForceLogout}
            onCancel={() => setShowForceLogoutConfirm(false)}
            dangerous
          />
        )}
      </AnimatePresence>
    </div>
  );
}