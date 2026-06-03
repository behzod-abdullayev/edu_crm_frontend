'use client';

import { useState } from 'react';
import { SystemConfig, SystemHealth, GlobalFeatureFlags } from '../types/owner.types';

const FEATURE_FLAG_LABELS: Record<keyof GlobalFeatureFlags, string> = {
  payments: 'Payments Module',
  chat: 'Chat & Messaging',
  certificates: 'Certificates',
  exams: 'Exams & Quizzes',
  analytics: 'Analytics Dashboard',
};

interface SystemConfigPanelProps {
  config: SystemConfig;
  health: SystemHealth;
  apiVersion: string;
  onSaveConfig: (config: SystemConfig) => Promise<void>;
  onClearCache: () => Promise<void>;
  onTriggerBackup: () => Promise<void>;
}

function HealthDot({ status }: { status: 'connected' | 'error' }) {
  return (
    <span
      className={[
        'inline-block h-2 w-2 rounded-full',
        status === 'connected' ? 'bg-green-500' : 'bg-red-500',
      ].join(' ')}
      aria-hidden="true"
    />
  );
}

export function SystemConfigPanel({
  config,
  health,
  apiVersion,
  onSaveConfig,
  onClearCache,
  onTriggerBackup,
}: SystemConfigPanelProps) {
  const [local, setLocal] = useState<SystemConfig>(config);
  const [confirmMaintenance, setConfirmMaintenance] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const toggleFeature = (key: keyof GlobalFeatureFlags) => {
    setLocal((prev) => ({
      ...prev,
      featureFlags: { ...prev.featureFlags, [key]: !prev.featureFlags[key] },
    }));
  };

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

  return (
    <div className="space-y-6">
      {/* System Health */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">System Health</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: 'API Status',
              value: health.status,
              ok: health.status === 'healthy',
            },
            {
              label: 'Database',
              value: health.dbStatus,
              ok: health.dbStatus === 'connected',
            },
            {
              label: 'Cache',
              value: health.cacheStatus,
              ok: health.cacheStatus === 'connected',
            },
            {
              label: 'Uptime',
              value: `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m`,
              ok: true,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <HealthDot status={item.ok ? 'connected' : 'error'} />
                <span className="text-sm font-medium capitalize text-foreground">
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          API Version: <span className="font-mono">{apiVersion}</span>
        </p>
      </div>

      {/* Maintenance Mode */}
      <div
        className={[
          'rounded-xl border p-6 transition-colors',
          local.maintenanceMode
            ? 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
            : 'border-border bg-card',
        ].join(' ')}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Maintenance Mode</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {local.maintenanceMode
                ? '⚠️ System is in maintenance mode — all users except owners are locked out'
                : 'Enable to temporarily restrict all access for maintenance'}
            </p>
          </div>
          <button
            onClick={handleMaintenanceToggle}
            className={[
              'relative h-7 w-14 rounded-full transition-colors',
              local.maintenanceMode ? 'bg-red-600' : 'bg-muted',
            ].join(' ')}
            type="button"
            role="switch"
            aria-checked={local.maintenanceMode}
          >
            <span
              className={[
                'absolute top-1.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                local.maintenanceMode ? 'translate-x-8' : 'translate-x-1',
              ].join(' ')}
            />
          </button>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Global Feature Flags</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          These settings apply to all tenants/branches
        </p>
        <div className="space-y-3">
          {(Object.keys(local.featureFlags) as (keyof GlobalFeatureFlags)[]).map((key) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{FEATURE_FLAG_LABELS[key]}</span>
              <button
                onClick={() => toggleFeature(key)}
                className={[
                  'relative h-6 w-11 rounded-full transition-colors',
                  local.featureFlags[key] ? 'bg-primary' : 'bg-muted',
                ].join(' ')}
                type="button"
                role="switch"
                aria-checked={local.featureFlags[key]}
              >
                <span
                  className={[
                    'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform',
                    local.featureFlags[key] ? 'translate-x-5' : 'translate-x-1',
                  ].join(' ')}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SMTP Config */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Email SMTP</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">SMTP Host</label>
            <input
              type="text"
              value={local.emailSmtp.host}
              onChange={(e) =>
                setLocal((p) => ({ ...p, emailSmtp: { ...p.emailSmtp, host: e.target.value } }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="smtp.gmail.com"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Port</label>
            <input
              type="number"
              value={local.emailSmtp.port}
              onChange={(e) =>
                setLocal((p) => ({ ...p, emailSmtp: { ...p.emailSmtp, port: Number(e.target.value) } }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="587"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">SMTP User</label>
            <input
              type="email"
              value={local.emailSmtp.user}
              onChange={(e) =>
                setLocal((p) => ({ ...p, emailSmtp: { ...p.emailSmtp, user: e.target.value } }))
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="noreply@academy.com"
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <button
              onClick={() =>
                setLocal((p) => ({ ...p, emailSmtp: { ...p.emailSmtp, secure: !p.emailSmtp.secure } }))
              }
              className={[
                'relative h-6 w-11 rounded-full transition-colors',
                local.emailSmtp.secure ? 'bg-primary' : 'bg-muted',
              ].join(' ')}
              type="button"
              role="switch"
              aria-checked={local.emailSmtp.secure}
            >
              <span className={[
                'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform',
                local.emailSmtp.secure ? 'translate-x-5' : 'translate-x-1',
              ].join(' ')} />
            </button>
            <span className="text-sm text-foreground">Use SSL/TLS</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          type="button"
        >
          {isSaving ? 'Saving…' : 'Save Configuration'}
        </button>
        <button
          onClick={handleClearCache}
          disabled={isClearingCache}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          type="button"
        >
          {isClearingCache ? 'Clearing…' : 'Clear Cache'}
        </button>
        <button
          onClick={handleBackup}
          disabled={isBackingUp}
          className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          type="button"
        >
          {isBackingUp ? 'Backing up…' : 'Trigger Backup'}
        </button>
        {savedAt && (
          <span className="flex items-center text-xs text-muted-foreground">
            Saved at {savedAt.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Maintenance Confirm Dialog */}
      {confirmMaintenance && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="alertdialog"
          aria-modal="true"
          aria-label="Enable maintenance mode"
        >
          <div className="w-full max-w-md rounded-2xl border border-red-300 bg-card p-6 shadow-xl dark:border-red-800">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Enable Maintenance Mode?</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              This will immediately lock out all users except owners. Students, teachers, and admins will see a maintenance page until you disable this mode.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmEnableMaintenance}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                type="button"
              >
                Enable Maintenance
              </button>
              <button
                onClick={() => setConfirmMaintenance(false)}
                className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-foreground hover:bg-muted"
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
