'use client';

/**
 * AdminCourseDetailClient — Admin Course Detail Page
 *
 * Tabs:
 *  1. Overview     — course info, stats, description
 *  2. Students     — enrolled students list with enrollment management
 *  3. Curriculum   — modules and lessons (ModuleList)
 *  4. Settings     — edit course (CourseCRUDForm), publish/archive/delete
 *
 * Features:
 *  - Animated tab navigation (Framer Motion)
 *  - Back button → /[locale]/admin/courses
 *  - startInEditMode: auto-switches to Settings tab
 *  - Publish/Unpublish + Archive/Restore + Delete course actions
 *  - Skeleton loaders while fetching
 *  - Fully responsive: mobile card layout, desktop table
 *  - Dark/light mode via CSS variables only
 *  - WCAG 2.1 AA: ARIA tabs, roles, keyboard nav
 *  - Zero "any" TypeScript types
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Globe,
  GlobeLock,
  Archive,
  Trash2,
  Edit2,
  Clock,
  BarChart2,
  ListChecks,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  useCourseDetail,
  useCourseLessons,
  useUpdateCourse,
  useDeleteCourse,
  usePublishCourse,
} from '@/services/query/courses.queries';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { useUIStore } from '@/store/ui.store';
import { SkeletonLoader } from '@/shared/components/feedback/SkeletonLoader';
import { ErrorState } from '@/shared/components/data-display/ErrorState';
import { EmptyState } from '@/shared/components/data-display/EmptyState';
import { StatusBadge } from '@/shared/components/ui/badge';
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog';
import { CourseCRUDForm } from '@/modules/courses/components/CourseCRUDForm';
import { EnrollmentManager } from '@/modules/courses/components/EnrollmentManager';
import type { Course, CourseStatus } from '@/services/api/courses.api';
import type { CourseDto } from '@/modules/courses/utils/course.mapper';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const I18N = {
  uz: {
    backToList: "Kurslarga qaytish",
    tabs: {
      overview: "Umumiy ko'rinish",
      students: "Talabalar",
      curriculum: "O'quv dastur",
      settings: "Sozlamalar",
    },
    overview: {
      description: "Tavsif",
      noDescription: "Tavsif qo'shilmagan.",
      stats: "Statistika",
      enrolled: "Ro'yxatdan o'tgan",
      status: "Holat",
      published: "E'lon qilingan",
      created: "Yaratilgan",
      updated: "Yangilangan",
      teacher: "O'qituvchi",
      category: "Kategoriya",
      duration: "Davomiyligi",
      startDate: "Boshlanish",
      endDate: "Tugash",
      minPerLesson: "daqiqa/dars",
      price: "Narxi",
      noCategory: "Kategoriya belgilanmagan",
    },
    curriculum: {
      title: "Modullar va darslar",
      noLessons: "Darslar qo'shilmagan.",
      noLessonsDesc: "Bu kursga hali modullar va darslar qo'shilmagan.",
      module: "Modul",
      lessons: "ta dars",
      completed: "ta bajarilgan",
    },
    settings: {
      editTitle: "Kurs ma'lumotlarini tahrirlash",
      dangerZone: "Xavfli hudud",
      publishBtn: "E'lon qilish",
      unpublishBtn: "E'lonni bekor qilish",
      archiveBtn: "Arxivlash",
      restoreBtn: "Tiklash",
      deleteBtn: "O'chirish",
      publishDesc: "Kursni talabalar ko'rishi uchun ochiq qiling.",
      unpublishDesc: "Kursni yashirish — talabalar ko'ra olmaydi.",
      archiveDesc: "Kursni arxivlash — yangi ro'yxatga olish to'xtatiladi.",
      deleteDesc: "Kursni butunlay o'chirish. Bu amalni bekor qilib bo'lmaydi.",
    },
    deleteConfirmTitle: "Kursni o'chirishni tasdiqlaysizmi?",
    deleteConfirmMessage: (name: string) =>
      `"${name}" kursi barcha ma'lumotlari bilan birga o'chirib tashlanadi.`,
    deleteConfirmBtn: "O'chirish",
    cancelBtn: "Bekor qilish",
    yes: "Ha",
    no: "Yo'q",
    freeLabel: "Bepul",
    statusLabels: { draft: "Qoralama", published: "E'lon qilingan", archived: "Arxivlangan" },
  },
  en: {
    backToList: "Back to courses",
    tabs: {
      overview: "Overview",
      students: "Students",
      curriculum: "Curriculum",
      settings: "Settings",
    },
    overview: {
      description: "Description",
      noDescription: "No description provided.",
      stats: "Stats",
      enrolled: "Enrolled",
      status: "Status",
      published: "Published",
      created: "Created",
      updated: "Updated",
      teacher: "Teacher",
      category: "Category",
      duration: "Duration",
      startDate: "Start Date",
      endDate: "End Date",
      minPerLesson: "min/lesson",
      price: "Price",
      noCategory: "No category assigned",
    },
    curriculum: {
      title: "Modules & Lessons",
      noLessons: "No lessons added yet.",
      noLessonsDesc: "This course doesn't have any modules or lessons yet.",
      module: "Module",
      lessons: "lessons",
      completed: "completed",
    },
    settings: {
      editTitle: "Edit Course Details",
      dangerZone: "Danger Zone",
      publishBtn: "Publish",
      unpublishBtn: "Unpublish",
      archiveBtn: "Archive",
      restoreBtn: "Restore",
      deleteBtn: "Delete Course",
      publishDesc: "Make this course visible to students.",
      unpublishDesc: "Hide this course — students won't see it.",
      archiveDesc: "Archive this course — stops new enrollments.",
      deleteDesc: "Permanently delete this course. This cannot be undone.",
    },
    deleteConfirmTitle: "Delete this course?",
    deleteConfirmMessage: (name: string) =>
      `"${name}" will be permanently deleted along with all its data.`,
    deleteConfirmBtn: "Delete",
    cancelBtn: "Cancel",
    yes: "Yes",
    no: "No",
    freeLabel: "Free",
    statusLabels: { draft: "Draft", published: "Published", archived: "Archived" },
  },
  ru: {
    backToList: "Назад к курсам",
    tabs: {
      overview: "Обзор",
      students: "Студенты",
      curriculum: "Программа",
      settings: "Настройки",
    },
    overview: {
      description: "Описание",
      noDescription: "Описание не добавлено.",
      stats: "Статистика",
      enrolled: "Записались",
      status: "Статус",
      published: "Опубликован",
      created: "Создан",
      updated: "Обновлён",
      teacher: "Преподаватель",
      category: "Категория",
      duration: "Продолжительность",
      startDate: "Начало",
      endDate: "Конец",
      minPerLesson: "мин/урок",
      price: "Цена",
      noCategory: "Категория не назначена",
    },
    curriculum: {
      title: "Модули и уроки",
      noLessons: "Уроки не добавлены.",
      noLessonsDesc: "У этого курса пока нет модулей или уроков.",
      module: "Модуль",
      lessons: "урок(ов)",
      completed: "завершено",
    },
    settings: {
      editTitle: "Редактировать курс",
      dangerZone: "Опасная зона",
      publishBtn: "Опубликовать",
      unpublishBtn: "Снять с публикации",
      archiveBtn: "Архивировать",
      restoreBtn: "Восстановить",
      deleteBtn: "Удалить курс",
      publishDesc: "Сделать курс видимым для студентов.",
      unpublishDesc: "Скрыть курс — студенты не будут его видеть.",
      archiveDesc: "Архивировать — прекратить новые записи.",
      deleteDesc: "Безвозвратно удалить курс со всеми данными.",
    },
    deleteConfirmTitle: "Удалить этот курс?",
    deleteConfirmMessage: (name: string) =>
      `"${name}" будет удалён вместе со всеми данными безвозвратно.`,
    deleteConfirmBtn: "Удалить",
    cancelBtn: "Отмена",
    yes: "Да",
    no: "Нет",
    freeLabel: "Бесплатно",
    statusLabels: { draft: "Черновик", published: "Опубликован", archived: "В архиве" },
  },
} as const;

type Locale = keyof typeof I18N;
type TabKey = 'overview' | 'students' | 'curriculum' | 'settings';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | undefined, locale: Locale): string {
  if (!iso) return '—';
  const intlLocale = locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US';
  try {
    return new Date(iso).toLocaleDateString(intlLocale, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return iso; }
}

// ─── Status color helper ──────────────────────────────────────────────────────

function statusBadgeStatus(status: CourseStatus): 'active' | 'inactive' | 'pending' {
  const map: Record<CourseStatus, 'active' | 'inactive' | 'pending'> = {
    published: 'active',
    archived: 'inactive',
    draft: 'pending',
  };
  return map[status] ?? 'pending';
}

function statusLabel(status: CourseStatus, s: (typeof I18N)[Locale]): string {
  return s.statusLabels[status] ?? status;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminCourseDetailClientProps {
  courseId: string;
  startInEditMode: boolean;
  locale: string;
}

// ─── Tab components ───────────────────────────────────────────────────────────

// Overview Tab
function OverviewTab({
  course,
  s,
  locale,
}: {
  course: Course;
  s: (typeof I18N)[Locale];
  locale: Locale;
}) {
  const infoRows: Array<{ label: string; value: React.ReactNode }> = [
    { label: s.overview.teacher, value: course.teacherName },
    { label: s.overview.status, value: <StatusBadge status={statusBadgeStatus(course.status)} label={statusLabel(course.status, s)} size="sm" /> },
    { label: s.overview.published, value: course.isPublished ? s.yes : s.no },
    { label: s.overview.enrolled, value: `${course.studentCount}` },
    { label: s.overview.category, value: course.categoryName ?? s.overview.noCategory },
    {
      label: s.overview.price,
      value: course.price
        ? `${course.price.toLocaleString()} ${course.currency ?? 'UZS'}`
        : s.freeLabel,
    },
    { label: s.overview.created, value: formatDate(course.createdAt, locale) },
    { label: s.overview.updated, value: formatDate(course.updatedAt, locale) },
  ];

  if (course.startDate) {
    infoRows.push({ label: s.overview.startDate, value: formatDate(course.startDate, locale) });
  }
  if (course.endDate) {
    infoRows.push({ label: s.overview.endDate, value: formatDate(course.endDate, locale) });
  }
  if (course.duration) {
    infoRows.push({ label: s.overview.duration, value: `${course.duration} ${s.overview.minPerLesson}` });
  }

  return (
    <motion.div
      key="overview"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-5"
    >
      {/* Description */}
      <div className="lg:col-span-2">
        <div
          className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
            {s.overview.description}
          </h3>
          {course.description ? (
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {course.description}
            </p>
          ) : (
            <p className="text-sm text-[var(--text-muted)] italic">{s.overview.noDescription}</p>
          )}
        </div>
      </div>

      {/* Info sidebar */}
      <div
        className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
          {s.overview.stats}
        </h3>
        <dl className="flex flex-col gap-3">
          {infoRows.map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-2">
              <dt className="text-xs text-[var(--text-muted)] shrink-0">{label}</dt>
              <dd className="text-xs font-medium text-[var(--text-primary)] text-right">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </motion.div>
  );
}

// Curriculum Tab
function CurriculumTab({
  courseId,
  s,
}: {
  courseId: string;
  s: (typeof I18N)[Locale];
}) {
  const { data: lessons, isLoading } = useCourseLessons(courseId);
  const [openModules, setOpenModules] = useState<Set<number>>(new Set([0]));

  if (isLoading) {
    return (
      <motion.div key="curriculum-loading" className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonLoader key={i} variant="card" />
        ))}
      </motion.div>
    );
  }

  if (!lessons || lessons.length === 0) {
    return (
      <motion.div
        key="curriculum-empty"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
      >
        <EmptyState
          icon={ListChecks}
          title={s.curriculum.noLessons}
          description={s.curriculum.noLessonsDesc}
        />
      </motion.div>
    );
  }

  const toggleModule = (idx: number) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  return (
    <motion.div
      key="curriculum"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3"
    >
      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
        {s.curriculum.title} ({lessons.length})
      </h3>
      {lessons.map((lesson, idx) => {
        const isOpen = openModules.has(idx);
        return (
          <div
            key={lesson.id}
            className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl overflow-hidden"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <button
              onClick={() => toggleModule(idx)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--bg-surface-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-inset"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{
                    background: 'color-mix(in srgb, var(--brand-primary) 12%, transparent)',
                    color: 'var(--brand-primary)',
                  }}
                  aria-hidden="true"
                >
                  {idx + 1}
                </div>
                <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {lesson.title}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-[var(--text-muted)]">
                  {lesson.materials?.[0]?.type ?? 'lesson'}
                </span>
                {isOpen
                  ? <ChevronDown size={15} className="text-[var(--text-muted)]" aria-hidden="true" />
                  : <ChevronRight size={15} className="text-[var(--text-muted)]" aria-hidden="true" />}
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-0 border-t border-[var(--border-default)]">
                    <div className="mt-3 flex flex-wrap gap-3">
                      {lesson.duration && (
                        <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                          <Clock size={12} aria-hidden="true" />
                          {lesson.duration} min
                        </span>
                      )}
                      {lesson.videoUrl && (
                        <a
                          href={lesson.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--brand-primary)] hover:underline"
                        >
                          Video
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </motion.div>
  );
}

// Settings Tab
function SettingsTab({
  course,
  locale: _locale,
  s,
  onDeleteRequest,
}: {
  course: Course;
  locale: string;
  s: (typeof I18N)[Locale];
  onDeleteRequest: () => void;
}) {
  const publishMutation = usePublishCourse();
  const updateMutation = useUpdateCourse(course.id);

  // Build CourseDto omitting undefined optional fields (exactOptionalPropertyTypes)
  const courseDto: CourseDto = {
    id: course.id,
    title: course.name,
    isPublished: course.isPublished,
    status: course.status,
    teacherId: course.teacherId,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
  if (course.description !== undefined) courseDto.description = course.description;
  if (course.thumbnailUrl !== undefined) courseDto.thumbnailUrl = course.thumbnailUrl;
  if (course.categoryId !== undefined) courseDto.categoryId = course.categoryId;
  if (course.difficultyLevel !== undefined) courseDto.difficultyLevel = course.difficultyLevel as 'beginner' | 'intermediate' | 'advanced';

  return (
    <motion.div
      key="settings"
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5"
    >
      {/* Edit form */}
      <div
        className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          {s.settings.editTitle}
        </h3>
        <CourseCRUDForm course={courseDto} />
      </div>

      {/* Danger zone */}
      <div
        className="bg-[var(--bg-surface)] border border-[var(--error-border)] rounded-xl p-5"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <h3 className="text-sm font-semibold text-[var(--error-text)] mb-4">
          {s.settings.dangerZone}
        </h3>
        <div className="flex flex-col gap-4">
          {/* Publish toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {course.isPublished ? s.settings.unpublishBtn : s.settings.publishBtn}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {course.isPublished ? s.settings.unpublishDesc : s.settings.publishDesc}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() =>
                publishMutation.mutate({
                  id: course.id,
                  status: course.isPublished ? 'draft' : 'published',
                })
              }
              disabled={publishMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] min-h-[44px] whitespace-nowrap"
            >
              {course.isPublished ? <GlobeLock size={14} aria-hidden="true" /> : <Globe size={14} aria-hidden="true" />}
              {course.isPublished ? s.settings.unpublishBtn : s.settings.publishBtn}
            </motion.button>
          </div>

          {/* Archive toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-[var(--border-default)]">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {course.status === 'archived' ? s.settings.restoreBtn : s.settings.archiveBtn}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.settings.archiveDesc}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() =>
                updateMutation.mutate({
                  status: course.status === 'archived' ? 'published' : 'archived',
                })
              }
              disabled={updateMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium border border-[var(--warning-border)] text-[var(--warning-text)] hover:bg-[var(--warning-bg)] disabled:opacity-50 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] min-h-[44px] whitespace-nowrap"
            >
              <Archive size={14} aria-hidden="true" />
              {course.status === 'archived' ? s.settings.restoreBtn : s.settings.archiveBtn}
            </motion.button>
          </div>

          {/* Delete */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-[var(--border-default)]">
            <div>
              <p className="text-sm font-medium text-[var(--error-text)]">{s.settings.deleteBtn}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.settings.deleteDesc}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onDeleteRequest}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium bg-[var(--error-bg)] border border-[var(--error-border)] text-[var(--error-text)] hover:bg-[var(--error-solid)] hover:text-white transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--error-solid)] min-h-[44px] whitespace-nowrap"
            >
              <Trash2 size={14} aria-hidden="true" />
              {s.settings.deleteBtn}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminCourseDetailClient({
  courseId,
  startInEditMode,
  locale,
}: AdminCourseDetailClientProps) {
  const resolvedLocale: Locale = (locale as Locale) in I18N ? (locale as Locale) : 'en';
  const s = I18N[resolvedLocale];
  const isMobile = useIsMobile();
  const router = useRouter();
  const { addToast: _addToast } = useUIStore();

  const [activeTab, setActiveTab] = useState<TabKey>(
    startInEditMode ? 'settings' : 'overview'
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: course, isLoading, error, refetch } = useCourseDetail(courseId);
  const deleteMutation = useDeleteCourse();

  const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: s.tabs.overview, icon: BarChart2 },
    { key: 'students', label: s.tabs.students, icon: Users },
    { key: 'curriculum', label: s.tabs.curriculum, icon: ListChecks },
    { key: 'settings', label: s.tabs.settings, icon: Settings },
  ];

  const handleDelete = useCallback(async () => {
    if (!course) return;
    await deleteMutation.mutateAsync(courseId);
    router.replace(`/${locale}/admin/courses`);
  }, [course, courseId, deleteMutation, router, locale]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-5 lg:p-6 max-w-[1400px] mx-auto">
        <div className="h-6 w-40 rounded bg-[var(--bg-surface-hover)] mb-6 animate-pulse" />
        <SkeletonLoader variant="card" />
        <div className="flex gap-2 mt-4 mb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-24 rounded-lg bg-[var(--bg-surface-hover)] animate-pulse" />
          ))}
        </div>
        <SkeletonLoader variant="card" count={2} />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorState
          error={error instanceof Error ? error : new Error('Course not found')}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 lg:p-6 max-w-[1400px] mx-auto">
      {/* Back link */}
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="mb-5"
      >
        <Link
          href={`/${locale}/admin/courses`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded"
        >
          <ArrowLeft size={15} aria-hidden="true" />
          {s.backToList}
        </Link>
      </motion.div>

      {/* Course header card */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-5 mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        <div className="flex items-start gap-4 min-w-0">
          {/* Course icon */}
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'color-mix(in srgb, var(--brand-primary) 12%, transparent)' }}
            aria-hidden="true"
          >
            <BookOpen size={22} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--text-primary)] truncate">
              {course.name}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <StatusBadge
                status={statusBadgeStatus(course.status)}
                label={statusLabel(course.status, s)}
                size="sm"
                dot
              />
              {course.isPublished && (
                <span
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: 'var(--success-text)' }}
                >
                  <Globe size={11} aria-hidden="true" />
                  {s.overview.published}
                </span>
              )}
              <span className="text-xs text-[var(--text-muted)]">
                {course.studentCount} {s.overview.enrolled}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {course.teacherName}
              </span>
            </div>
          </div>
        </div>

        {/* Quick action: Edit */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setActiveTab('settings')}
          className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-default)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] min-h-[44px] shrink-0 self-start"
        >
          <Edit2 size={14} aria-hidden="true" />
          {!isMobile && s.settings.editTitle.split(' ').slice(-1)[0]}
        </motion.button>
      </motion.div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 mb-5 overflow-x-auto"
        role="tablist"
        aria-label="Course detail tabs"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <motion.button
              key={tab.key}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.key}`}
              id={`tab-${tab.key}`}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-[var(--transition-fast)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] whitespace-nowrap min-h-[40px]"
              style={{
                background: isActive ? 'var(--brand-primary)' : 'transparent',
                color: isActive ? 'var(--text-on-brand)' : 'var(--text-secondary)',
              }}
            >
              <Icon size={14} aria-hidden="true" />
              {!isMobile || tab.key === activeTab ? tab.label : null}
              {isMobile && tab.key !== activeTab ? null : null}
            </motion.button>
          );
        })}
      </div>

      {/* Tab panels */}
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'overview' && (
          <OverviewTab key="overview" course={course} s={s} locale={resolvedLocale} />
        )}
        {activeTab === 'students' && (
          <motion.div
            key="students"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
          >
            <EnrollmentManager courseId={courseId} />
          </motion.div>
        )}
        {activeTab === 'curriculum' && (
          <CurriculumTab key="curriculum" courseId={courseId} s={s} />
        )}
        {activeTab === 'settings' && (
          <SettingsTab
            key="settings"
            course={course}
            locale={locale}
            s={s}
            onDeleteRequest={() => setShowDeleteConfirm(true)}
          />
        )}
      </div>

      {/* Delete confirm dialog */}
      {showDeleteConfirm && (
        <ConfirmDialog
          open={showDeleteConfirm}
          title={s.deleteConfirmTitle}
          description={s.deleteConfirmMessage(course.name)}
          confirmLabel={s.deleteConfirmBtn}
          cancelLabel={s.cancelBtn}
          variant="destructive"
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
