'use client';

/**
 * Admin Settings Page
 * Route: /[locale]/(dashboard)/admin/settings
 */

import type { Metadata } from 'next';
import { useState, useCallback, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings,
  Zap,
  Bell,
  DollarSign,
  Building2,
  Save,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  CreditCard,
  MessageSquare,
  Award,
  FileText,
} from 'lucide-react';
import { useAdminSettings } from '@modules/admin/hooks/useAdmin';
import { TenantConfigForm } from '@modules/admin/components/TenantConfigForm';
import { PricingManager } from '@modules/admin/components/PricingManager';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { cn } from '@shared/utils/cn';
import type { TenantConfig, FeatureFlags } from '@modules/admin/types/admin.types';

// ─── Metadata export (used by Next.js for static metadata) ───────────────────

export const metadata: Metadata = {
  title: 'Settings | Admin — EduCRM',
  robots: { index: false, follow: false },
};

// ─── Section type ─────────────────────────────────────────────────────────────

type SettingsSection = 'general' | 'pricing' | 'features' | 'notifications';

interface SectionMeta {
  id: SettingsSection;
  label: string;
  description: string;
  icon: React.ElementType;
}

const SECTIONS: SectionMeta[] = [
  {
    id: 'general',
    label: 'General',
    icon: Building2,
    description: 'Academy name, timezone and branding',
  },
  {
    id: 'pricing',
    label: 'Pricing',
    icon: DollarSign,
    description: 'Course prices and currencies',
  },
  {
    id: 'features',
    label: 'Features',
    icon: Zap,
    description: 'Enable or disable platform modules',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'System notification preferences',
  },
];

// ─── Feature toggle item ──────────────────────────────────────────────────────

interface FeatureItemProps {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}

function FeatureItem({ icon: Icon, label, description, enabled, onToggle }: FeatureItemProps) {
  return (
    <motion.div
      layout
      className="flex items-center gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 transition-shadow duration-[var(--transition-base)] hover:shadow-[var(--shadow-md)]"
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-[var(--transition-base)]',
          enabled
            ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
            : 'bg-[var(--bg-surface-secondary)] text-[var(--text-muted)]',
        )}
      >
        <Icon size={18} aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{description}</p>
      </div>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onToggle}
        role="switch"
        aria-checked={enabled}
        aria-label={`Toggle ${label}`}
        className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2"
      >
        {enabled ? (
          <ToggleRight size={32} className="text-[var(--brand-primary)]" aria-hidden="true" />
        ) : (
          <ToggleLeft size={32} className="text-[var(--text-muted)]" aria-hidden="true" />
        )}
      </motion.button>
    </motion.div>
  );
}

// ─── Feature flags meta ────────────────────────────────────────────────────────

const FEATURE_META: Record<
  keyof FeatureFlags,
  { label: string; description: string; icon: React.ElementType }
> = {
  payments: {
    label: 'Payment Module',
    description: 'Enable invoicing, debt tracking, and payment history',
    icon: CreditCard,
  },
  chat: {
    label: 'Chat & Messaging',
    description: 'Real-time messaging between teachers, students, and admins',
    icon: MessageSquare,
  },
  certificates: {
    label: 'Certificates',
    description: 'Allow students to download course completion certificates',
    icon: Award,
  },
  exams: {
    label: 'Exams & Quizzes',
    description: 'Online exam engine with automated grading support',
    icon: FileText,
  },
};

// ─── Features section ─────────────────────────────────────────────────────────

interface FeaturesSectionProps {
  features: FeatureFlags;
  onToggle: (key: keyof FeatureFlags) => void;
  onSave: () => Promise<void>;
}

function FeaturesSection({ features, onToggle, onSave }: FeaturesSectionProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  }, [onSave]);

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      <div className="flex gap-2.5 rounded-xl border border-[var(--warning-border)] bg-[var(--warning-bg)] px-4 py-3">
        <AlertTriangle
          size={16}
          className="mt-0.5 shrink-0 text-[var(--warning-text)]"
          aria-hidden="true"
        />
        <p className="text-xs leading-relaxed text-[var(--warning-text)]">
          Disabling a module hides it from all users but does not delete existing data.
          Re-enabling will restore access immediately.
        </p>
      </div>

      {/* Feature toggles */}
      {(Object.keys(FEATURE_META) as (keyof FeatureFlags)[]).map((key) => {
        const meta = FEATURE_META[key];
        return (
          <FeatureItem
            key={key}
            icon={meta.icon}
            label={meta.label}
            description={meta.description}
            enabled={features[key]}
            onToggle={() => onToggle(key)}
          />
        );
      })}

      {/* Save row */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="flex items-center gap-1.5 text-sm text-[var(--success-text)]"
            >
              <CheckCircle2 size={14} aria-hidden="true" />
              Saved
            </motion.span>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-[var(--text-on-brand)] outline-none transition-colors hover:bg-[var(--brand-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <Save size={14} aria-hidden="true" />
          {saving ? 'Saving…' : 'Save Features'}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Notification preference ──────────────────────────────────────────────────

const NOTIFICATION_PREFS = [
  {
    key: 'paymentOverdue',
    label: 'Payment Overdue Alerts',
    description: 'Notify admin when a student payment becomes overdue',
    defaultEnabled: true,
  },
  {
    key: 'newEnrollment',
    label: 'New Enrollment',
    description: 'Notify when a student enrolls in a new course',
    defaultEnabled: true,
  },
  {
    key: 'attendanceLow',
    label: 'Low Attendance Warning',
    description: "Alert when a student's attendance drops below 70%",
    defaultEnabled: false,
  },
  {
    key: 'homeworkDeadline',
    label: 'Homework Deadline Reminders',
    description: 'Send reminders 24 hours before homework deadlines',
    defaultEnabled: true,
  },
  {
    key: 'weeklyReport',
    label: 'Weekly Summary Report',
    description: 'Receive a weekly performance digest every Monday',
    defaultEnabled: false,
  },
] as const;

type NotifKey = (typeof NOTIFICATION_PREFS)[number]['key'];

function NotificationsSection() {
  const [enabled, setEnabled] = useState<Record<NotifKey, boolean>>(
    () =>
      Object.fromEntries(
        NOTIFICATION_PREFS.map((p) => [p.key, p.defaultEnabled]),
      ) as Record<NotifKey, boolean>,
  );
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggle = useCallback((key: NotifKey) => {
    setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      // PATCH /api/admin/settings/notifications
      await new Promise<void>((res) => setTimeout(res, 600));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  }, []);

  return (
    <div className="space-y-4">
      {NOTIFICATION_PREFS.map((pref) => (
        <FeatureItem
          key={pref.key}
          icon={Bell}
          label={pref.label}
          description={pref.description}
          enabled={enabled[pref.key]}
          onToggle={() => toggle(pref.key)}
        />
      ))}

      <div className="flex items-center justify-end gap-3 pt-2">
        <AnimatePresence>
          {saved && (
            <motion.span
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              className="flex items-center gap-1.5 text-sm text-[var(--success-text)]"
            >
              <CheckCircle2 size={14} aria-hidden="true" />
              Saved
            </motion.span>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-[var(--text-on-brand)] outline-none transition-colors hover:bg-[var(--brand-primary-hover)] focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 disabled:opacity-60"
        >
          <Save size={14} aria-hidden="true" />
          {isPending ? 'Saving…' : 'Save Notifications'}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Section content switcher ──────────────────────────────────────────────────

interface ContentProps {
  section: SettingsSection;
  config: TenantConfig | null;
  pricing: ReturnType<typeof useAdminSettings>['pricing'];
  isLoading: boolean;
  onSaveConfig: (cfg: TenantConfig) => Promise<void>;
  onUpdatePrice: (id: string, price: number, currency: string) => Promise<void>;
  onDeletePrice: (id: string) => Promise<void>;
  features: FeatureFlags;
  onToggleFeature: (key: keyof FeatureFlags) => void;
  onSaveFeatures: () => Promise<void>;
}

function SectionContent({
  section,
  config,
  pricing,
  isLoading,
  onSaveConfig,
  onUpdatePrice,
  onDeletePrice,
  features,
  onToggleFeature,
  onSaveFeatures,
}: ContentProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader variant="card" count={4} />
      </div>
    );
  }

  switch (section) {
    case 'general':
      return config ? (
        <TenantConfigForm initialConfig={config} onSave={onSaveConfig} />
      ) : (
        <p className="text-sm text-[var(--text-muted)]">No configuration found.</p>
      );

    case 'pricing':
      return (
        <PricingManager
          entries={pricing}
          currencies={['UZS', 'USD', 'EUR', 'RUB']}
          onUpdatePrice={onUpdatePrice}
          onDeleteEntry={onDeletePrice}
        />
      );

    case 'features':
      return (
        <FeaturesSection
          features={features}
          onToggle={onToggleFeature}
          onSave={onSaveFeatures}
        />
      );

    case 'notifications':
      return <NotificationsSection />;

    default:
      return null;
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const { config, pricing, isLoading, saveConfig, updatePrice, deletePrice } = useAdminSettings();

  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  // Local feature flags state (applied on top of config until saved)
  const [localFeatures, setLocalFeatures] = useState<FeatureFlags | null>(null);

  const defaultFeatures: FeatureFlags = {
    payments: true,
    chat: false,
    certificates: true,
    exams: false,
  };

  const features: FeatureFlags = localFeatures ?? config?.features ?? defaultFeatures;

  const handleToggleFeature = useCallback((key: keyof FeatureFlags) => {
    setLocalFeatures((prev) => {
      const base = prev ?? config?.features ?? defaultFeatures;
      return { ...base, [key]: !base[key] };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const handleSaveFeatures = useCallback(async () => {
    if (!config) return;
    await saveConfig({ ...config, features });
    setLocalFeatures(null);
  }, [config, features, saveConfig]);

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-5 lg:px-8 lg:py-8">

        {/* ── Page header ───────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10">
              <Settings size={22} className="text-[var(--brand-primary)]" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
                Settings
              </h1>
              <p className="text-sm text-[var(--text-muted)]">Manage your academy configuration</p>
            </div>
          </div>
        </motion.div>

        {/* ── Layout ────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">

          {/* Sidebar nav */}
          <nav
            aria-label="Settings sections"
            className="flex gap-2 overflow-x-auto pb-1 lg:w-56 lg:shrink-0 lg:flex-col lg:overflow-visible lg:pb-0"
          >
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <motion.button
                  key={section.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setActiveSection(section.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex min-w-[110px] items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors duration-[var(--transition-base)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                    'lg:min-w-0 lg:w-full lg:px-4 lg:py-3',
                    isActive
                      ? 'bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]',
                  )}
                >
                  <Icon size={15} aria-hidden="true" />
                  <span className="whitespace-nowrap">{section.label}</span>
                  {isActive && (
                    <ChevronRight
                      size={13}
                      className="ml-auto hidden shrink-0 text-[var(--brand-primary)] lg:block"
                      aria-hidden="true"
                    />
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* Content panel */}
          <main className="min-w-0 flex-1">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {/* Section header */}
                {(() => {
                  const s = SECTIONS.find((sec) => sec.id === activeSection);
                  if (!s) return null;
                  const Icon = s.icon;
                  return (
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]">
                        <Icon size={16} aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                          {s.label}
                        </h2>
                        <p className="text-xs text-[var(--text-muted)]">{s.description}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Section body */}
                <SectionContent
                  section={activeSection}
                  config={config}
                  pricing={pricing}
                  isLoading={isLoading}
                  onSaveConfig={saveConfig}
                  onUpdatePrice={updatePrice}
                  onDeletePrice={deletePrice}
                  features={features}
                  onToggleFeature={handleToggleFeature}
                  onSaveFeatures={handleSaveFeatures}
                />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
