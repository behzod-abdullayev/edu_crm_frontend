'use client';

import { useState } from 'react';
import { TenantConfig, FeatureFlags } from '../types/admin.types';

const TIMEZONES = [
  'Asia/Tashkent',
  'Asia/Almaty',
  'Europe/Moscow',
  'Europe/London',
  'America/New_York',
];

const CURRENCIES = ['UZS', 'USD', 'EUR', 'RUB'];

const FEATURE_FLAG_LABELS: Record<keyof FeatureFlags, string> = {
  payments: 'Payment Module',
  chat: 'Chat / Messaging',
  certificates: 'Certificates',
  exams: 'Exams & Quizzes',
};

interface TenantConfigFormProps {
  initialConfig: TenantConfig;
  onSave: (config: TenantConfig) => Promise<void>;
}

export function TenantConfigForm({ initialConfig, onSave }: TenantConfigFormProps) {
  const [config, setConfig] = useState<TenantConfig>(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const updateField = <K extends keyof TenantConfig>(key: K, value: TenantConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFeature = (key: keyof FeatureFlags) => {
    setConfig((prev) => ({
      ...prev,
      features: { ...prev.features, [key]: !prev.features[key] },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(config);
      setSavedAt(new Date());
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Academy Info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-foreground">Academy Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Academy Name</label>
            <input
              type="text"
              value={config.academyName}
              onChange={(e) => updateField('academyName', e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Academy name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Timezone</label>
            <select
              value={config.timezone}
              onChange={(e) => updateField('timezone', e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Default Currency</label>
            <select
              value={config.currency}
              onChange={(e) => updateField('currency', e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Primary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => updateField('primaryColor', e.target.value)}
                className="h-9 w-16 cursor-pointer rounded-lg border border-border bg-background p-1"
              />
              <input
                type="text"
                value={config.primaryColor}
                onChange={(e) => updateField('primaryColor', e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="#3B82F6"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Logo URL</label>
          <input
            type="url"
            value={config.logoUrl ?? ''}
            onChange={(e) => updateField('logoUrl', e.target.value || null)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="https://…/logo.png"
          />
        </div>
      </div>

      {/* Feature Flags */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Feature Flags</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Toggle modules on or off for this academy
        </p>
        <div className="space-y-3">
          {(Object.keys(config.features) as (keyof FeatureFlags)[]).map((key) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-foreground">{FEATURE_FLAG_LABELS[key]}</span>
              <button
                onClick={() => toggleFeature(key)}
                className={[
                  'relative h-6 w-11 rounded-full transition-colors',
                  config.features[key] ? 'bg-primary' : 'bg-muted',
                ].join(' ')}
                type="button"
                role="switch"
                aria-checked={config.features[key]}
                aria-label={FEATURE_FLAG_LABELS[key]}
              >
                <span
                  className={[
                    'absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform',
                    config.features[key] ? 'translate-x-5' : 'translate-x-1',
                  ].join(' ')}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          type="button"
        >
          {isSaving ? 'Saving…' : 'Save Changes'}
        </button>
        {savedAt && (
          <p className="text-xs text-muted-foreground">
            Saved at {savedAt.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
}
