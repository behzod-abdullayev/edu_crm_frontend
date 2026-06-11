'use client';

/**
 * AdminCoursesClient — Admin Courses List Page
 *
 * Type fixes applied vs initial version:
 *  1. PaginatedResponse uses `total` not `meta` → compute totalPages manually
 *  2. CourseListParams.search is optional (exactOptionalPropertyTypes) →
 *     omit key entirely when undefined via spread
 *  3. ConfirmDialog uses `variant: 'destructive'` not `destructive: true`
 *  4. CourseDto from course.mapper.ts uses optional fields → map carefully
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen, Search, Edit2, Trash2, Eye, Globe, GlobeLock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useCourseList, useDeleteCourse, usePublishCourse } from '@/services/query/courses.queries';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { SkeletonLoader } from '@/shared/components/feedback/SkeletonLoader';
import { EmptyState } from '@/shared/components/data-display/EmptyState';
import { ErrorState } from '@/shared/components/data-display/ErrorState';
import { StatusBadge } from '@/shared/components/ui/badge';
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog';
import { CourseCRUDForm } from '@/modules/courses/components/CourseCRUDForm';
import type { Course, CourseListParams, CourseStatus } from '@/services/api/courses.api';
import type { CourseDto } from '@/modules/courses/utils/course.mapper';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const I18N = {
  uz: {
    title: "Kurslar", subtitle: "Barcha kurslarni boshqaring",
    createBtn: "Yangi kurs", searchPlaceholder: "Kurs qidirish…",
    filterAll: "Barcha", filterDraft: "Qoralama",
    filterPublished: "E'lon qilingan", filterArchived: "Arxivlangan",
    colName: "Nomi", colTeacher: "O'qituvchi", colStudents: "Talabalar",
    colStatus: "Holat", colPublished: "E'lon", colCreated: "Yaratilgan", colActions: "Amallar",
    viewDetail: "Ko'rish", editCourse: "Tahrirlash", deleteCourse: "O'chirish",
    publishCourse: "E'lon qilish", unpublishCourse: "Bekor",
    deleteConfirmTitle: "Kursni o'chirishni tasdiqlaysizmi?",
    deleteConfirmMessage: (name: string) => `"${name}" butunlay o'chirib tashlanadi.`,
    deleteConfirmBtn: "O'chirish", cancelBtn: "Bekor qilish",
    noCoursesTitle: "Kurslar topilmadi", noCoursesDesc: "Birinchi kursni yarating.",
    noSearchTitle: "Natijalar topilmadi", noSearchDesc: "Boshqa kalit so'z bilan qidiring.",
    published: "Ha", unpublished: "Yo'q",
    page: "Sahifa", of: "dan", students: "ta talaba", total: "ta",
    createCourse: "Kurs yaratish", editCourseTitle: "Kursni tahrirlash",
    statusDraft: "Qoralama", statusPublished: "E'lon qilingan", statusArchived: "Arxivlangan",
    loadMore: "Ko'proq yuklash", prevPage: "Oldingi sahifa", nextPage: "Keyingi sahifa",
    pageNumber: (n: number) => `${n}-sahifa`,
  },
  en: {
    title: "Courses", subtitle: "Manage all courses",
    createBtn: "New Course", searchPlaceholder: "Search courses…",
    filterAll: "All", filterDraft: "Draft",
    filterPublished: "Published", filterArchived: "Archived",
    colName: "Name", colTeacher: "Teacher", colStudents: "Students",
    colStatus: "Status", colPublished: "Published", colCreated: "Created", colActions: "Actions",
    viewDetail: "View", editCourse: "Edit", deleteCourse: "Delete",
    publishCourse: "Publish", unpublishCourse: "Unpublish",
    deleteConfirmTitle: "Delete course?",
    deleteConfirmMessage: (name: string) => `"${name}" will be permanently deleted.`,
    deleteConfirmBtn: "Delete", cancelBtn: "Cancel",
    noCoursesTitle: "No courses found", noCoursesDesc: "Create your first course.",
    noSearchTitle: "No results", noSearchDesc: "Try a different keyword.",
    published: "Yes", unpublished: "No",
    page: "Page", of: "of", students: "students", total: "total",
    createCourse: "Create Course", editCourseTitle: "Edit Course",
    statusDraft: "Draft", statusPublished: "Published", statusArchived: "Archived",
    loadMore: "Load more", prevPage: "Previous page", nextPage: "Next page",
    pageNumber: (n: number) => `Page ${n}`,
  },
  ru: {
    title: "Курсы", subtitle: "Управление всеми курсами",
    createBtn: "Новый курс", searchPlaceholder: "Поиск курсов…",
    filterAll: "Все", filterDraft: "Черновики",
    filterPublished: "Опубликованные", filterArchived: "Архив",
    colName: "Название", colTeacher: "Преподаватель", colStudents: "Студенты",
    colStatus: "Статус", colPublished: "Опубликован", colCreated: "Создан", colActions: "Действия",
    viewDetail: "Просмотр", editCourse: "Редактировать", deleteCourse: "Удалить",
    publishCourse: "Опубликовать", unpublishCourse: "Снять",
    deleteConfirmTitle: "Удалить курс?",
    deleteConfirmMessage: (name: string) => `"${name}" будет удалён безвозвратно.`,
    deleteConfirmBtn: "Удалить", cancelBtn: "Отмена",
    noCoursesTitle: "Курсы не найдены", noCoursesDesc: "Создайте первый курс.",
    noSearchTitle: "Результатов нет", noSearchDesc: "Попробуйте другой запрос.",
    published: "Да", unpublished: "Нет",
    page: "Страница", of: "из", students: "студентов", total: "всего",
    createCourse: "Создать курс", editCourseTitle: "Редактировать курс",
    statusDraft: "Черновик", statusPublished: "Опубликован", statusArchived: "В архиве",
    loadMore: "Загрузить ещё", prevPage: "Предыдущая страница", nextPage: "Следующая страница",
    pageNumber: (n: number) => `Страница ${n}`,
  },
} as const;

type Locale = keyof typeof I18N;
type StatusFilter = CourseStatus | 'all';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string, locale: Locale): string {
  const intlLocale = locale === 'uz' ? 'uz-UZ' : locale === 'ru' ? 'ru-RU' : 'en-US';
  try { return new Date(iso).toLocaleDateString(intlLocale, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

function statusBadgeStatus(status: CourseStatus): 'active' | 'inactive' | 'pending' {
  const map: Record<CourseStatus, 'active' | 'inactive' | 'pending'> = {
    published: 'active', archived: 'inactive', draft: 'pending',
  };
  return map[status] ?? 'pending';
}

function statusLabel(status: CourseStatus, s: (typeof I18N)[Locale]): string {
  const map: Record<CourseStatus, string> = {
    draft: s.statusDraft, published: s.statusPublished, archived: s.statusArchived,
  };
  return map[status] ?? status;
}

/** Convert Course (API) → CourseDto (form mapper), omitting undefined optional fields */
function toCourseDto(c: Course): CourseDto {
  const dto: CourseDto = {
    id: c.id,
    name: c.name,
    thumbnailKey: null,
    isPublished: c.isPublished,
    status: c.status,
    teacherId: c.teacherId,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
  if (c.description !== undefined) dto.description = c.description;
  if (c.thumbnailUrl !== undefined) dto.thumbnailUrl = c.thumbnailUrl;
  if (c.categoryId !== undefined) dto.categoryId = c.categoryId;
  return dto;
}

// ─── Row Actions ──────────────────────────────────────────────────────────────

function RowActions({ course, locale, onEdit, onDelete, onPublishToggle, s }: {
  course: Course; locale: string;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
  onPublishToggle: (c: Course) => void;
  s: (typeof I18N)[Locale];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`Actions for ${course.name}`}
        aria-expanded={open} aria-haspopup="menu"
        className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
      >
        ⋯
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.12 }}
              role="menu" className="absolute right-0 top-full mt-1 z-40 w-44 rounded-[var(--radius-lg)] py-1 overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}
            >
              <Link href={`/${locale}/admin/courses/${course.id}`} role="menuitem" onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                <Eye size={14} aria-hidden="true" />{s.viewDetail}
              </Link>
              <button role="menuitem" onClick={() => { onEdit(course); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left">
                <Edit2 size={14} aria-hidden="true" />{s.editCourse}
              </button>
              <button role="menuitem" onClick={() => { onPublishToggle(course); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors text-left">
                {course.isPublished ? <GlobeLock size={14} aria-hidden="true" /> : <Globe size={14} aria-hidden="true" />}
                {course.isPublished ? s.unpublishCourse : s.publishCourse}
              </button>
              <div className="my-1 border-t border-[var(--border-default)]" role="separator" />
              <button role="menuitem" onClick={() => { onDelete(course); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[var(--error-text)] hover:bg-[var(--error-bg)] transition-colors text-left">
                <Trash2 size={14} aria-hidden="true" />{s.deleteCourse}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

function MobileCourseCard({ course, locale, onEdit, onDelete, index, s }: {
  course: Course; locale: string;
  onEdit: (c: Course) => void;
  onDelete: (c: Course) => void;
  index: number;
  s: (typeof I18N)[Locale];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'color-mix(in srgb, var(--brand-primary) 12%, transparent)' }} aria-hidden="true">
            <BookOpen size={18} style={{ color: 'var(--brand-primary)' }} />
          </div>
          <div className="min-w-0">
            <Link href={`/${locale}/admin/courses/${course.id}`} className="block font-semibold text-sm text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors truncate">
              {course.name}
            </Link>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{course.teacherName}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <StatusBadge status={statusBadgeStatus(course.status)} label={statusLabel(course.status, s)} size="sm" />
              <span className="text-xs text-[var(--text-muted)]">{course.studentCount} {s.students}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => onEdit(course)} aria-label={`${s.editCourse}: ${course.name}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
            <Edit2 size={14} aria-hidden="true" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.92 }} onClick={() => onDelete(course)} aria-label={`${s.deleteCourse}: ${course.name}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:text-[var(--error-text)] hover:bg-[var(--error-bg)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
            <Trash2 size={14} aria-hidden="true" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Course Form Modal ────────────────────────────────────────────────────────

function CourseFormModal({ title, courseDto, onClose, isMobile }: {
  title: string; courseDto?: CourseDto; onClose: () => void; isMobile: boolean;
}) {
  if (isMobile) {
    return (
      <>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden="true" />
        <motion.div
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          role="dialog" aria-modal="true" aria-label={title}
          className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] flex flex-col rounded-t-[var(--radius-2xl)] overflow-hidden"
          style={{ background: 'var(--bg-surface)' }}
        >
          <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-strong)' }} />
          </div>
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-default)]">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
            <CourseCRUDForm {...(courseDto !== undefined ? { course: courseDto } : {})} onSuccess={onClose} />
          </div>
        </motion.div>
      </>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'var(--bg-overlay)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }} transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        role="dialog" aria-modal="true" aria-label={title}
        className="w-full max-w-[560px] rounded-[var(--radius-xl)] overflow-hidden"
        style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-xl)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)]">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] transition-colors">✕</button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <CourseCRUDForm {...(courseDto !== undefined ? { course: courseDto } : {})} onSuccess={onClose} />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const LIMIT = 10;
const STATUS_FILTERS: StatusFilter[] = ['all', 'draft', 'published', 'archived'];

export function AdminCoursesClient() {
  const locale = useLocale() as Locale;
  const s = I18N[locale in I18N ? locale : 'en'];
  const isMobile = useIsMobile();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Build params — omit undefined keys to satisfy exactOptionalPropertyTypes
  const queryParams: CourseListParams = {
    page,
    limit: LIMIT,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(statusFilter !== 'all' ? { status: statusFilter as CourseStatus } : {}),
  };

  const { data, isLoading, error, refetch } = useCourseList(queryParams);
  const deleteMutation = useDeleteCourse();
  const publishMutation = usePublishCourse();

  const courses = data?.data ?? [];
  // PaginatedResponse has: { data, total, page, limit, totalPages }
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const handleEdit = useCallback((course: Course) => setEditCourse(course), []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, deleteMutation]);

  const handlePublishToggle = useCallback(
    async (course: Course) => { await publishMutation.mutateAsync(course.id); },
    [publishMutation]
  );

  const filterLabel = (f: StatusFilter): string => ({
    all: s.filterAll, draft: s.filterDraft,
    published: s.filterPublished, archived: s.filterArchived,
  }[f] ?? f);

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <ErrorState error={error instanceof Error ? error : new Error('Failed to load courses')} onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 lg:p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--text-primary)]">{s.title}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">{s.subtitle}</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-[var(--text-on-brand)] font-semibold text-sm hover:bg-[var(--brand-primary-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2 min-h-[44px] self-start sm:self-auto">
          <Plus size={16} aria-hidden="true" />{s.createBtn}
        </motion.button>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.25 }}
        className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 min-w-0">
          <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={s.searchPlaceholder} aria-label={s.searchPlaceholder}
            className="w-full h-10 pl-9 pr-4 rounded-[var(--radius-md)] border border-[var(--border-default)] text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] placeholder:text-[var(--text-muted)] outline-none transition-all hover:border-[var(--border-strong)] focus:border-[var(--border-focus)]"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-[var(--radius-md)] overflow-x-auto shrink-0"
          style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-default)' }}
          role="group" aria-label="Status filter">
          {STATUS_FILTERS.map((f) => (
            <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }} aria-pressed={statusFilter === f}
              className="px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] whitespace-nowrap"
              style={{ background: statusFilter === f ? 'var(--brand-primary)' : 'transparent', color: statusFilter === f ? 'var(--text-on-brand)' : 'var(--text-secondary)' }}>
              {filterLabel(f)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        isMobile ? (
          <div className="flex flex-col gap-3">{Array.from({ length: 6 }).map((_, i) => <SkeletonLoader key={i} variant="card" />)}</div>
        ) : (
          <SkeletonLoader variant="table" />
        )
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={debouncedSearch ? s.noSearchTitle : s.noCoursesTitle}
          description={debouncedSearch ? s.noSearchDesc : s.noCoursesDesc}
          {...(!debouncedSearch ? { action: { label: s.createBtn, onClick: () => setShowCreate(true) } } : {})}
        />
      ) : isMobile ? (
        <div className="flex flex-col gap-3">
          {courses.map((course, i) => (
            <MobileCourseCard key={course.id} course={course} locale={locale} onEdit={handleEdit} onDelete={(c) => setDeleteTarget(c)} index={i} s={s} />
          ))}
          {page < totalPages && (
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setPage((p) => p + 1)}
              className="mt-2 w-full py-3 rounded-xl border border-[var(--border-default)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors">
              {s.loadMore}
            </motion.button>
          )}
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
          className="rounded-xl border border-[var(--border-default)] overflow-hidden"
          style={{ background: 'var(--bg-surface)', boxShadow: 'var(--shadow-sm)' }}>
          <div className="overflow-x-auto">
            <table className="w-full" aria-label={s.title}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-secondary)', borderBottom: '1px solid var(--border-default)' }}>
                  {[s.colName, s.colTeacher, s.colStudents, s.colStatus, s.colPublished, s.colCreated, s.colActions].map((col) => (
                    <th key={col} scope="col" className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courses.map((course, i) => (
                  <motion.tr key={course.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.04, 0.4) }}
                    className="border-b border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'color-mix(in srgb, var(--brand-primary) 12%, transparent)' }} aria-hidden="true">
                          <BookOpen size={14} style={{ color: 'var(--brand-primary)' }} />
                        </div>
                        <div className="min-w-0">
                          <Link href={`/${locale}/admin/courses/${course.id}`} className="text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--brand-primary)] transition-colors truncate block max-w-[200px]">{course.name}</Link>
                          {course.description && <p className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">{course.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)] whitespace-nowrap">{course.teacherName}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-secondary)] tabular-nums">{course.studentCount}</td>
                    <td className="px-4 py-3"><StatusBadge status={statusBadgeStatus(course.status)} label={statusLabel(course.status, s)} size="sm" /></td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: course.isPublished ? 'var(--success-text)' : 'var(--text-muted)' }}>
                        {course.isPublished ? <Globe size={12} aria-hidden="true" /> : <GlobeLock size={12} aria-hidden="true" />}
                        {course.isPublished ? s.published : s.unpublished}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)] whitespace-nowrap">{formatDate(course.createdAt, locale)}</td>
                    <td className="px-4 py-3">
                      <RowActions course={course} locale={locale} onEdit={handleEdit} onDelete={(c) => setDeleteTarget(c)} onPublishToggle={handlePublishToggle} s={s} />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-default)]" style={{ background: 'var(--bg-surface-secondary)' }}>
              <p className="text-xs text-[var(--text-muted)]">{s.page} {page} {s.of} {totalPages} · {total} {s.total}</p>
              <div className="flex items-center gap-1">
                <motion.button whileTap={{ scale: 0.94 }} onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} aria-label={s.prevPage}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
                  <ChevronLeft size={15} aria-hidden="true" />
                </motion.button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pg = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                  return (
                    <motion.button key={pg} whileTap={{ scale: 0.94 }} onClick={() => setPage(pg)} aria-label={s.pageNumber(pg)} aria-current={pg === page ? 'page' : undefined}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                      style={{ background: pg === page ? 'var(--brand-primary)' : 'transparent', color: pg === page ? 'var(--text-on-brand)' : 'var(--text-secondary)' }}>
                      {pg}
                    </motion.button>
                  );
                })}
                <motion.button whileTap={{ scale: 0.94 }} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} aria-label={s.nextPage}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]">
                  <ChevronRight size={15} aria-hidden="true" />
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Create/Edit Modals */}
      <AnimatePresence>
        {showCreate && <CourseFormModal key="create" title={s.createCourse} onClose={() => setShowCreate(false)} isMobile={isMobile} />}
        {editCourse && <CourseFormModal key="edit" title={s.editCourseTitle} courseDto={toCourseDto(editCourse)} onClose={() => setEditCourse(null)} isMobile={isMobile} />}
      </AnimatePresence>

      {/* Delete confirm — uses variant not destructive prop */}
      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          title={s.deleteConfirmTitle}
          description={s.deleteConfirmMessage(deleteTarget.name)}
          confirmLabel={s.deleteConfirmBtn}
          cancelLabel={s.cancelBtn}
          variant="destructive"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
