'use client';

// src/modules/admin/components/AdminDashboardClient.tsx

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { uz, ru, enUS } from 'date-fns/locale';
import type { Locale as DateFnsLocale } from 'date-fns';
import { useAdminDashboard } from '../hooks/useAdmin';
import { OperationalDashboard } from './OperationalDashboard';
import { AdminDashboardSkeleton } from './AdminDashboardSkeleton';

// ─── i18n ───────────────────────────────────────────────────────────────────

const I18N = {
  uz: {
    title: 'Admin bosh sahifasi',
    subtitle: 'Akademiyangiz faoliyatiga umumiy nazar',
    viewReports: "Hisobotlarni ko'rish",
    viewReportsAria: "Hisobotlarni ko'rish",
    errorTitle: "Boshqaruv panelini yuklab bo'lmadi",
    retry: 'Qayta urinish',
    emptyTitle: "Hozircha boshqaruv paneli ma'lumotlari yo'q",
    emptyDescription: "Backend ulangach, boshqaruv paneli ma'lumotlari shu yerda paydo bo'ladi.",
    refresh: 'Yangilash',
    operational: {
      kpi: {
        students: "Jami o'quvchilar",
        teachers: "Jami o'qituvchilar",
        courses: 'Jami kurslar',
        revenue: 'Oylik daromad',
        enrollments: 'Yangi yozilishlar',
        pending: "Kutilayotgan to'lovlar",
      },
      kpiListAria: "Asosiy ko'rsatkichlar",
      vsLastMonth: 'oxirgi oyga nisbatan',
      trendUp: 'Oshish',
      trendDown: 'Pasayish',
      charts: {
        revenue: 'Daromad (12 oy)',
        enrollments: 'Yozilishlar (6 oy)',
        attendanceByGroup: "Guruhlar bo'yicha davomat",
        paymentStatus: "To'lov holati",
      },
      debt: {
        paid: "To'langan",
        pending: 'Kutilmoqda',
        overdue: "Muddati o'tgan",
      },
      attendanceTooltip: 'Davomat',
      paymentLegendAria: "To'lov holati ro'yxati",
      quickActions: {
        createCourse: 'Kurs yaratish',
        addTeacher: "O'qituvchi qo'shish",
        addStudent: "O'quvchi qo'shish",
        viewReports: "Hisobotlarni ko'rish",
      },
      quickActionsAria: 'Tezkor amallar',
      recentActivity: "So'nggi faollik",
      recentActivityAria: "So'nggi faollik",
      recentActivityListAria: "So'nggi faollik ro'yxati",
      noRecentActivity: "So'nggi faollik mavjud emas.",
    },
  },
  en: {
    title: 'Admin Dashboard',
    subtitle: "Overview of your academy's performance",
    viewReports: 'View Reports',
    viewReportsAria: 'View reports',
    errorTitle: 'Failed to load dashboard',
    retry: 'Retry',
    emptyTitle: 'No dashboard data yet',
    emptyDescription: 'Dashboard data will appear here once the backend is connected.',
    refresh: 'Refresh',
    operational: {
      kpi: {
        students: 'Students',
        teachers: 'Teachers',
        courses: 'Courses',
        revenue: 'Revenue',
        enrollments: 'Enrollments',
        pending: 'Pending',
      },
      kpiListAria: 'Key performance indicators',
      vsLastMonth: 'vs last month',
      trendUp: 'Up',
      trendDown: 'Down',
      charts: {
        revenue: 'Revenue (12 months)',
        enrollments: 'Enrollments (6 months)',
        attendanceByGroup: 'Attendance by Group',
        paymentStatus: 'Payment Status',
      },
      debt: {
        paid: 'Paid',
        pending: 'Pending',
        overdue: 'Overdue',
      },
      attendanceTooltip: 'Attendance',
      paymentLegendAria: 'Payment status legend',
      quickActions: {
        createCourse: 'Create Course',
        addTeacher: 'Add Teacher',
        addStudent: 'Add Student',
        viewReports: 'View Reports',
      },
      quickActionsAria: 'Quick actions',
      recentActivity: 'Recent Activity',
      recentActivityAria: 'Recent activity',
      recentActivityListAria: 'Recent activity list',
      noRecentActivity: 'No recent activity.',
    },
  },
  ru: {
    title: 'Панель администратора',
    subtitle: 'Обзор показателей вашей академии',
    viewReports: 'Смотреть отчёты',
    viewReportsAria: 'Смотреть отчёты',
    errorTitle: 'Не удалось загрузить панель управления',
    retry: 'Повторить',
    emptyTitle: 'Данных панели управления пока нет',
    emptyDescription: 'Данные появятся здесь, как только сервер будет подключён.',
    refresh: 'Обновить',
    operational: {
      kpi: {
        students: 'Студенты',
        teachers: 'Учителя',
        courses: 'Курсы',
        revenue: 'Доход',
        enrollments: 'Новые записи',
        pending: 'Ожидают оплаты',
      },
      kpiListAria: 'Ключевые показатели',
      vsLastMonth: 'по сравнению с прошлым месяцем',
      trendUp: 'Рост',
      trendDown: 'Снижение',
      charts: {
        revenue: 'Доход (12 месяцев)',
        enrollments: 'Записи (6 месяцев)',
        attendanceByGroup: 'Посещаемость по группам',
        paymentStatus: 'Статус оплаты',
      },
      debt: {
        paid: 'Оплачено',
        pending: 'Ожидает',
        overdue: 'Просрочено',
      },
      attendanceTooltip: 'Посещаемость',
      paymentLegendAria: 'Легенда статуса оплаты',
      quickActions: {
        createCourse: 'Создать курс',
        addTeacher: 'Добавить учителя',
        addStudent: 'Добавить студента',
        viewReports: 'Смотреть отчёты',
      },
      quickActionsAria: 'Быстрые действия',
      recentActivity: 'Недавняя активность',
      recentActivityAria: 'Недавняя активность',
      recentActivityListAria: 'Список недавней активности',
      noRecentActivity: 'Нет недавней активности.',
    },
  },
} as const;

type Locale = keyof typeof I18N;

const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = { uz, en: enUS, ru };

// ─── Page transition variants ─────────────────────────────────────────────────

const pageVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// ─── AdminDashboardClient ─────────────────────────────────────────────────────

export function AdminDashboardClient() {
  const rawLocale = useLocale();
  const locale: Locale = rawLocale in I18N ? (rawLocale as Locale) : 'en';
  const s = I18N[locale];
  const dateLocale = DATE_FNS_LOCALES[locale];
  const router = useRouter();

  const { data, isLoading, error, refresh } = useAdminDashboard();

  const handleNavigate = useCallback(
    (path: string) => {
      router.push(`/${locale}${path}`);
    },
    [router, locale],
  );

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error !== null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center"
        role="alert"
        aria-live="assertive"
      >
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--error-bg)] border border-[var(--error-border)]"
          aria-hidden="true"
        >
          <span className="text-2xl">⚠️</span>
        </div>
        <div>
          <p className="text-base font-semibold text-[var(--text-primary)]">
            {s.errorTitle}
          </p>
          <p className="mt-1 text-sm text-[var(--text-muted)] max-w-sm">
            {error}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => void refresh()}
          className="mt-2 flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-5 py-2.5
            text-sm font-medium text-[var(--text-on-brand)]
            hover:bg-[var(--brand-primary-hover)] transition-colors
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2"
          type="button"
        >
          <RefreshCw size={14} aria-hidden="true" />
          {s.retry}
        </motion.button>
      </motion.div>
    );
  }

  // ── Empty / no data state ─────────────────────────────────────────────────
  if (data === null) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center"
      >
        <div className="h-16 w-16 rounded-2xl bg-[var(--bg-surface-secondary)] flex items-center justify-center text-2xl">
          📊
        </div>
        <p className="text-base font-semibold text-[var(--text-primary)]">
          {s.emptyTitle}
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          {s.emptyDescription}
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => void refresh()}
          className="mt-1 flex items-center gap-2 rounded-lg border border-[var(--border-default)]
            px-4 py-2 text-sm font-medium text-[var(--text-secondary)]
            hover:bg-[var(--bg-surface-hover)] transition-colors
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          type="button"
        >
          <RefreshCw size={14} aria-hidden="true" />
          {s.refresh}
        </motion.button>
      </motion.div>
    );
  }

  // ── Success state ────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
            {s.title}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            {s.subtitle}
          </p>
        </div>

        {/* Quick export button */}
        <motion.button
          whileHover={{ y: -1, boxShadow: 'var(--shadow-md)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleNavigate('/admin/reports')}
          className="flex min-h-[44px] items-center gap-2 rounded-lg
            border border-[var(--border-default)] bg-[var(--bg-surface)]
            px-4 py-2.5 text-sm font-medium text-[var(--text-primary)]
            transition-colors hover:bg-[var(--bg-surface-hover)]
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2"
          type="button"
          aria-label={s.viewReportsAria}
        >
          <span aria-hidden="true">📊</span>
          <span className="hidden sm:inline">{s.viewReports}</span>
        </motion.button>
      </div>

      {/* ── Main dashboard ───────────────────────────────────────────────── */}
      <OperationalDashboard
        data={data}
        onNavigate={handleNavigate}
        strings={s.operational}
        dateLocale={dateLocale}
      />
    </motion.div>
  );
}
