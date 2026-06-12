'use client';

/**
 * Admin Settings Page (client component)
 * Route: /[locale]/(dashboard)/admin/settings
 *
 * Rendered by the server-component page.tsx, which owns generateMetadata().
 */

import { useState, useCallback, useTransition } from 'react';
import { useLocale } from 'next-intl';
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
import { useAdminSettings, useAdminNotificationPreferences } from '@modules/admin/hooks/useAdmin';
import { TenantConfigForm } from '@modules/admin/components/TenantConfigForm';
import { PricingManager } from '@modules/admin/components/PricingManager';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { cn } from '@shared/utils/cn';
import type { TenantConfig, FeatureFlags } from '@modules/admin/types/admin.types';

// ─── i18n ───────────────────────────────────────────────────────────────────

const I18N = {
  uz: {
    title: 'Sozlamalar',
    subtitle: 'Akademiya konfiguratsiyasini boshqarish',
    sectionsNav: "Sozlamalar bo'limlari",
    noConfig: 'Konfiguratsiya topilmadi.',
    sections: {
      general: { label: 'Umumiy', description: 'Akademiya nomi, vaqt mintaqasi va brending' },
      pricing: { label: 'Narxlash', description: 'Kurs narxlari va valyutalar' },
      features: { label: 'Funksiyalar', description: "Platforma modullarini yoqish yoki o'chirish" },
      notifications: { label: 'Bildirishnomalar', description: 'Tizim bildirishnoma sozlamalari' },
    },
    features: {
      payments: { label: "To'lov moduli", description: "Hisob-fakturalar, qarzlarni kuzatish va to'lovlar tarixini yoqish" },
      chat: { label: 'Chat va xabarlar', description: "O'qituvchilar, talabalar va administratorlar o'rtasida real vaqtdagi xabar almashinuvi" },
      certificates: { label: 'Sertifikatlar', description: "Talabalarga kursni tugatish sertifikatlarini yuklab olish imkonini berish" },
      exams: { label: 'Imtihonlar va testlar', description: 'Avtomatik baholash bilan onlayn imtihon tizimi' },
    },
    notifications: {
      paymentOverdue: { label: "To'lov muddati o'tishi haqida ogohlantirish", description: "Talaba to'lovi muddati o'tganda administratorga xabar berish" },
      newEnrollment: { label: "Yangi ro'yxatga olish", description: 'Talaba yangi kursga yozilganda xabar berish' },
      attendanceLow: { label: 'Past davomat haqida ogohlantirish', description: "Talabaning davomati 70% dan pastga tushganda ogohlantirish" },
      homeworkDeadline: { label: 'Uy vazifasi muddati haqida eslatma', description: 'Uy vazifasi muddatidan 24 soat oldin eslatma yuborish' },
      weeklyReport: { label: 'Haftalik hisobot', description: 'Har dushanba haftalik samaradorlik hisobotini olish' },
    },
    featuresWarning: "Modulni o'chirish uni barcha foydalanuvchilardan yashiradi, lekin mavjud ma'lumotlarni o'chirmaydi. Qayta yoqish kirishni darhol tiklaydi.",
    saving: 'Saqlanmoqda…',
    saveFeatures: 'Funksiyalarni saqlash',
    saveNotifications: 'Bildirishnomalarni saqlash',
    saved: 'Saqlandi',
    enable: 'Yoqish',
    disable: "O'chirish",
  },
  en: {
    title: 'Settings',
    subtitle: 'Manage your academy configuration',
    sectionsNav: 'Settings sections',
    noConfig: 'No configuration found.',
    sections: {
      general: { label: 'General', description: 'Academy name, timezone and branding' },
      pricing: { label: 'Pricing', description: 'Course prices and currencies' },
      features: { label: 'Features', description: 'Enable or disable platform modules' },
      notifications: { label: 'Notifications', description: 'System notification preferences' },
    },
    features: {
      payments: { label: 'Payment Module', description: 'Enable invoicing, debt tracking, and payment history' },
      chat: { label: 'Chat & Messaging', description: 'Real-time messaging between teachers, students, and admins' },
      certificates: { label: 'Certificates', description: 'Allow students to download course completion certificates' },
      exams: { label: 'Exams & Quizzes', description: 'Online exam engine with automated grading support' },
    },
    notifications: {
      paymentOverdue: { label: 'Payment Overdue Alerts', description: 'Notify admin when a student payment becomes overdue' },
      newEnrollment: { label: 'New Enrollment', description: 'Notify when a student enrolls in a new course' },
      attendanceLow: { label: 'Low Attendance Warning', description: "Alert when a student's attendance drops below 70%" },
      homeworkDeadline: { label: 'Homework Deadline Reminders', description: 'Send reminders 24 hours before homework deadlines' },
      weeklyReport: { label: 'Weekly Summary Report', description: 'Receive a weekly performance digest every Monday' },
    },
    featuresWarning: 'Disabling a module hides it from all users but does not delete existing data. Re-enabling will restore access immediately.',
    saving: 'Saving…',
    saveFeatures: 'Save Features',
    saveNotifications: 'Save Notifications',
    saved: 'Saved',
    enable: 'Enable',
    disable: 'Disable',
  },
  ru: {
    title: 'Настройки',
    subtitle: 'Управление конфигурацией вашей академии',
    sectionsNav: 'Разделы настроек',
    noConfig: 'Конфигурация не найдена.',
    sections: {
      general: { label: 'Общие', description: 'Название академии, часовой пояс и брендинг' },
      pricing: { label: 'Цены', description: 'Цены на курсы и валюты' },
      features: { label: 'Функции', description: 'Включение и отключение модулей платформы' },
      notifications: { label: 'Уведомления', description: 'Настройки системных уведомлений' },
    },
    features: {
      payments: { label: 'Модуль платежей', description: 'Включить выставление счетов, учёт задолженностей и историю платежей' },
      chat: { label: 'Чат и сообщения', description: 'Обмен сообщениями в реальном времени между преподавателями, студентами и админами' },
      certificates: { label: 'Сертификаты', description: 'Разрешить студентам скачивать сертификаты о прохождении курса' },
      exams: { label: 'Экзамены и тесты', description: 'Система онлайн-экзаменов с автоматической проверкой' },
    },
    notifications: {
      paymentOverdue: { label: 'Уведомления о просрочке платежа', description: 'Уведомлять администратора, когда платёж студента просрочен' },
      newEnrollment: { label: 'Новая запись на курс', description: 'Уведомлять, когда студент записывается на новый курс' },
      attendanceLow: { label: 'Предупреждение о низкой посещаемости', description: 'Предупреждать, когда посещаемость студента падает ниже 70%' },
      homeworkDeadline: { label: 'Напоминания о сроках домашних заданий', description: 'Отправлять напоминания за 24 часа до срока сдачи домашнего задания' },
      weeklyReport: { label: 'Еженедельный отчёт', description: 'Получать еженедельную сводку показателей каждый понедельник' },
    },
    featuresWarning: 'Отключение модуля скрывает его от всех пользователей, но не удаляет существующие данные. Повторное включение немедленно восстановит доступ.',
    saving: 'Сохранение…',
    saveFeatures: 'Сохранить функции',
    saveNotifications: 'Сохранить уведомления',
    saved: 'Сохранено',
    enable: 'Включить',
    disable: 'Отключить',
  },
} as const;

type Locale = keyof typeof I18N;
type SettingsStrings = (typeof I18N)[Locale];

// ─── Section type ─────────────────────────────────────────────────────────────

type SettingsSection = 'general' | 'pricing' | 'features' | 'notifications';

interface SectionMeta {
  id: SettingsSection;
  label: string;
  description: string;
  icon: React.ElementType;
}

function getSections(s: SettingsStrings): SectionMeta[] {
  return [
    { id: 'general', label: s.sections.general.label, icon: Building2, description: s.sections.general.description },
    { id: 'pricing', label: s.sections.pricing.label, icon: DollarSign, description: s.sections.pricing.description },
    { id: 'features', label: s.sections.features.label, icon: Zap, description: s.sections.features.description },
    { id: 'notifications', label: s.sections.notifications.label, icon: Bell, description: s.sections.notifications.description },
  ];
}

// ─── Feature toggle item ──────────────────────────────────────────────────────

interface FeatureItemProps {
  icon: React.ElementType;
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  toggleAriaLabel: string;
}

function FeatureItem({ icon: Icon, label, description, enabled, onToggle, toggleAriaLabel }: FeatureItemProps) {
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
        aria-label={toggleAriaLabel}
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

function getFeatureMeta(
  s: SettingsStrings,
): Record<keyof FeatureFlags, { label: string; description: string; icon: React.ElementType }> {
  return {
    payments: { label: s.features.payments.label, description: s.features.payments.description, icon: CreditCard },
    chat: { label: s.features.chat.label, description: s.features.chat.description, icon: MessageSquare },
    certificates: { label: s.features.certificates.label, description: s.features.certificates.description, icon: Award },
    exams: { label: s.features.exams.label, description: s.features.exams.description, icon: FileText },
  };
}

// ─── Features section ─────────────────────────────────────────────────────────

interface FeaturesSectionProps {
  s: SettingsStrings;
  features: FeatureFlags;
  onToggle: (key: keyof FeatureFlags) => void;
  onSave: () => Promise<void>;
}

function FeaturesSection({ s, features, onToggle, onSave }: FeaturesSectionProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const featureMeta = getFeatureMeta(s);

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
          {s.featuresWarning}
        </p>
      </div>

      {/* Feature toggles */}
      {(Object.keys(featureMeta) as (keyof FeatureFlags)[]).map((key) => {
        const meta = featureMeta[key];
        const enabled = features[key];
        return (
          <FeatureItem
            key={key}
            icon={meta.icon}
            label={meta.label}
            description={meta.description}
            enabled={enabled}
            onToggle={() => onToggle(key)}
            toggleAriaLabel={`${enabled ? s.disable : s.enable} ${meta.label}`}
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
              {s.saved}
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
          {saving ? s.saving : s.saveFeatures}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Notification preference ──────────────────────────────────────────────────

const NOTIFICATION_KEYS = [
  'paymentOverdue',
  'newEnrollment',
  'attendanceLow',
  'homeworkDeadline',
  'weeklyReport',
] as const;

const NOTIFICATION_DEFAULTS: Record<(typeof NOTIFICATION_KEYS)[number], boolean> = {
  paymentOverdue: true,
  newEnrollment: true,
  attendanceLow: false,
  homeworkDeadline: true,
  weeklyReport: false,
};

type NotifKey = (typeof NOTIFICATION_KEYS)[number];

interface NotificationsSectionProps {
  s: SettingsStrings;
}

function NotificationsSection({ s }: NotificationsSectionProps) {
  const { preferences, isLoading, savePreferences } = useAdminNotificationPreferences();
  const [localPrefs, setLocalPrefs] = useState<Partial<Record<NotifKey, boolean>> | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const enabled: Record<NotifKey, boolean> = {
    ...NOTIFICATION_DEFAULTS,
    ...(preferences as Partial<Record<NotifKey, boolean>>),
    ...localPrefs,
  };

  const toggle = useCallback((key: NotifKey) => {
    setLocalPrefs((prev) => ({ ...(prev ?? {}), [key]: !enabled[key] }));
    setSaved(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const handleSave = useCallback(() => {
    startTransition(async () => {
      await savePreferences(enabled);
      setLocalPrefs(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, savePreferences]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader variant="card" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {NOTIFICATION_KEYS.map((key) => {
        const meta = s.notifications[key];
        const isEnabled = enabled[key];
        return (
          <FeatureItem
            key={key}
            icon={Bell}
            label={meta.label}
            description={meta.description}
            enabled={isEnabled}
            onToggle={() => toggle(key)}
            toggleAriaLabel={`${isEnabled ? s.disable : s.enable} ${meta.label}`}
          />
        );
      })}

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
              {s.saved}
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
          {isPending ? s.saving : s.saveNotifications}
        </motion.button>
      </div>
    </div>
  );
}

// ─── Section content switcher ──────────────────────────────────────────────────

interface ContentProps {
  s: SettingsStrings;
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
  s,
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
        <p className="text-sm text-[var(--text-muted)]">{s.noConfig}</p>
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
          s={s}
          features={features}
          onToggle={onToggleFeature}
          onSave={onSaveFeatures}
        />
      );

    case 'notifications':
      return <NotificationsSection s={s} />;

    default:
      return null;
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function AdminSettingsClient() {
  const { config, pricing, isLoading, saveConfig, updatePrice, deletePrice } = useAdminSettings();

  const rawLocale = useLocale();
  const locale: Locale = rawLocale in I18N ? (rawLocale as Locale) : 'en';
  const s = I18N[locale];
  const SECTIONS = getSections(s);

  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

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
                {s.title}
              </h1>
              <p className="text-sm text-[var(--text-muted)]">{s.subtitle}</p>
            </div>
          </div>
        </motion.div>

        {/* ── Layout ────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">

          {/* Sidebar nav */}
          <nav
            aria-label={s.sectionsNav}
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
                  const sectionMeta = SECTIONS.find((sec) => sec.id === activeSection);
                  if (!sectionMeta) return null;
                  const Icon = sectionMeta.icon;
                  return (
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]">
                        <Icon size={16} aria-hidden="true" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                          {sectionMeta.label}
                        </h2>
                        <p className="text-xs text-[var(--text-muted)]">{sectionMeta.description}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Section body */}
                <SectionContent
                  s={s}
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