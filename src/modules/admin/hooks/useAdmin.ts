// src/modules/admin/hooks/useAdmin.ts
// ✅ FIX: Added try/catch to ALL hooks, validate API responses are arrays/objects before use

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teachersApi, type CreateTeacherDto } from '@/services/api/teachers.api';
import { studentsApi, type Student, type CreateStudentDto } from '@/services/api/students.api';
import { schedulesApi } from '@/services/api/schedules.api';
import {
  adminApi,
  type AdminDashboardStats,
  type PaymentsReport,
  type DebtReport,
  type AttendanceReport,
  type OperationalReport,
} from '@/services/api/admin.api';
import type { Course } from '@/services/api/courses.api';
import { queryKeys } from '@/services/query/keys.factory';
import { useTeacherList } from '@/services/query/teachers.queries';
import { useStudentList } from '@/services/query/students.queries';
import { useCourseList } from '@/services/query/courses.queries';
import type {
  AdminDashboardData,
  ChartDataPoint,
  GroupAttendance,
  DebtBreakdown,
  DashboardTrends,
  ActivityItem,
  CourseDto,
  TeacherDto,
  StudentDto,
  ScheduleEventForm,
  ReportType,
  TenantConfig,
  PricingEntry,
} from '../types/admin.types';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Ensure value is a proper array, not an error object */
function ensureArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

/** Ensure value is a proper object with specific key, not an error response */
function _isValidObject(value: unknown, requiredKey: string): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    requiredKey in (value as Record<string, unknown>)
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

interface BackendAdminDashboard {
  totalStudents?: number;
  totalTeachers?: number;
  totalCourses?: number;
  totalRevenue?: number;
  monthlyRevenue?: number;
  currency?: string;
  activeGroups?: number;
  pendingPayments?: number;
  overduePayments?: number;
  attendanceRate?: number;
  todayAttendanceRate?: number;
  newStudentsThisMonth?: number;
  newEnrollments?: number;
  revenueChangePercent?: number;
  recentActivities?: Array<{
    id: string;
    type: string;
    description: string;
    actorName?: string | null;
    actor?: string;
    timestamp: string;
  }>;
  recentActivity?: ActivityItem[];
  revenueHistory?: ChartDataPoint[];
  enrollmentHistory?: ChartDataPoint[];
  attendanceByGroup?: GroupAttendance[];
  debtBreakdown?: DebtBreakdown;
  trends?: DashboardTrends;
}

function mapBackendAdminDashboard(raw: BackendAdminDashboard): AdminDashboardData {
  if (raw.trends !== undefined && raw.recentActivity !== undefined) {
    return raw as unknown as AdminDashboardData;
  }

  const revenueChange = raw.revenueChangePercent ?? 0;

  return {
    totalStudents: raw.totalStudents ?? 0,
    totalTeachers: raw.totalTeachers ?? 0,
    totalCourses: raw.totalCourses ?? 0,
    monthlyRevenue: raw.monthlyRevenue ?? raw.totalRevenue ?? 0,
    newEnrollments: raw.newStudentsThisMonth ?? raw.newEnrollments ?? 0,
    pendingPayments: raw.pendingPayments ?? 0,
    revenueHistory: raw.revenueHistory ?? [],
    enrollmentHistory: raw.enrollmentHistory ?? [],
    attendanceByGroup: raw.attendanceByGroup ?? [],
    debtBreakdown: raw.debtBreakdown ?? {
      paid: 0,
      pending: raw.pendingPayments ?? 0,
      overdue: raw.overduePayments ?? 0,
    },
    recentActivity:
      raw.recentActivity ??
      (raw.recentActivities ?? []).map((a) => ({
        id: a.id,
        type: (['payment', 'enrollment', 'event'].includes(a.type)
          ? a.type
          : 'event') as ActivityItem['type'],
        description: a.description,
        actor: a.actorName ?? a.actor ?? 'System',
        timestamp: a.timestamp,
      })),
    trends: raw.trends ?? {
      studentsChange: 0,
      teachersChange: 0,
      revenueChange,
      enrollmentChange: 0,
    },
  };
}

export function useAdminDashboard() {
  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: queryKeys.admin.dashboard(),
    queryFn: () => adminApi.getDashboard(),
    staleTime: 5 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });

  return {
    data: data ? mapBackendAdminDashboard(data as AdminDashboardStats & BackendAdminDashboard) : null,
    isLoading,
    error: queryError
      ? queryError instanceof Error
        ? queryError.message
        : 'Failed to load dashboard'
      : null,
    refresh: refetch,
  };
}

// ── Courses ───────────────────────────────────────────────────────────────────

function courseToDto(c: Course): CourseDto {
  return {
    id: c.id,
    name: c.name,
    teacherId: c.teacherId,
    teacherName: c.teacherName,
    studentsEnrolled: c.studentCount,
    price: c.price ?? 0,
    currency: c.currency ?? 'UZS',
    status: c.status === 'published' ? 'active' : c.status === 'archived' ? 'archived' : 'draft',
    startDate: c.startDate ?? c.createdAt,
    endDate: c.endDate ?? null,
    createdAt: c.createdAt,
  };
}

export function useAdminCourses() {
  const { data, isLoading, error: queryError, refetch } = useCourseList({ page: 1, limit: 100 });

  const courses = (data?.data ?? []).map(courseToDto);

  return {
    courses,
    isLoading,
    error: queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load courses') : null,
    refresh: refetch,
  };
}

// ── Teachers ──────────────────────────────────────────────────────────────────

function teacherToDto(t: { id: string; firstName: string; lastName: string; email: string; phone?: string; status: string; activeCourseCount: number; createdAt: string }): TeacherDto {
  return {
    id: t.id,
    name: `${t.firstName} ${t.lastName}`.trim(),
    email: t.email,
    phone: t.phone ?? '',
    groupsAssigned: t.activeCourseCount,
    joinedDate: t.createdAt,
    status: t.status === 'active' ? 'active' : 'inactive',
    branchId: '',
  };
}

export function useAdminTeachers() {
  const queryClient = useQueryClient();
  const { data, isLoading, error: queryError, refetch } = useTeacherList({ page: 1, limit: 100 });

  const teachers = (data?.data ?? []).map(teacherToDto);

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      teachersApi.update(id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.teachers.lists() });
    },
  });

  const toggleStatus = useCallback(
    async (id: string, status: 'active' | 'inactive') => {
      await toggleMutation.mutateAsync({ id, status });
    },
    [toggleMutation],
  );

  const createMutation = useMutation({
    mutationFn: (dto: CreateTeacherDto) => teachersApi.create(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.teachers.lists() });
    },
  });

  const createTeacher = useCallback(
    async (dto: CreateTeacherDto) => createMutation.mutateAsync(dto),
    [createMutation],
  );

  return {
    teachers,
    isLoading,
    error: queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load teachers') : null,
    toggleStatus,
    createTeacher,
    isCreatingTeacher: createMutation.isPending,
    refresh: refetch,
  };
}

// ── Students ──────────────────────────────────────────────────────────────────

function studentToDto(s: Student): StudentDto {
  const debt = s.debtAmount ?? 0;
  return {
    id: s.id,
    name: `${s.firstName} ${s.lastName}`.trim(),
    email: s.email,
    phone: s.phone ?? '',
    courses: [],
    attendancePercent: s.attendancePercent ?? 0,
    balance: s.balance,
    currency: 'UZS',
    status: s.status === 'active' ? 'active' : 'inactive',
    paymentStatus: debt > 0 ? 'overdue' : s.balance < 0 ? 'pending' : 'paid',
  };
}

export function useAdminStudents() {
  const queryClient = useQueryClient();
  const { data, isLoading, error: queryError, refetch } = useStudentList({ page: 1, limit: 100 });

  const students = (data?.data ?? []).map(studentToDto);

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'inactive' }) =>
      studentsApi.update(id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
    },
  });

  const toggleStatus = useCallback(
    async (id: string, status: 'active' | 'inactive') => {
      await toggleMutation.mutateAsync({ id, status });
    },
    [toggleMutation],
  );

  const createMutation = useMutation({
    mutationFn: (dto: CreateStudentDto) => studentsApi.create(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.students.lists() });
    },
  });

  const createStudent = useCallback(
    async (dto: CreateStudentDto) => createMutation.mutateAsync(dto),
    [createMutation],
  );

  return {
    students,
    isLoading,
    error: queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load students') : null,
    toggleStatus,
    createStudent,
    isCreatingStudent: createMutation.isPending,
    refresh: refetch,
  };
}

// ── Schedule ──────────────────────────────────────────────────────────────────

/** Default visible window for the schedule calendar: 2 weeks back, 8 weeks ahead. */
function getScheduleRange(): { from: string; to: string } {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const from = new Date();
  from.setDate(from.getDate() - 14);
  const to = new Date();
  to.setDate(to.getDate() + 56);
  return { from: fmt(from), to: fmt(to) };
}

export function useAdminSchedule() {
  const queryClient = useQueryClient();
  const range = getScheduleRange();

  const { data, isLoading, error: queryError, refetch } = useQuery({
    queryKey: queryKeys.schedules.calendar(range),
    queryFn: () => schedulesApi.getCalendar(range),
  });

  const events = data ?? [];

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.schedules.all });
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (form: ScheduleEventForm) => schedulesApi.create(form),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: ScheduleEventForm }) => schedulesApi.update(id, form),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => schedulesApi.remove(id),
    onSuccess: invalidate,
  });

  const createEvent = useCallback(
    async (form: ScheduleEventForm) => {
      await createMutation.mutateAsync(form);
    },
    [createMutation],
  );

  const updateEvent = useCallback(
    async (id: string, form: ScheduleEventForm) => {
      await updateMutation.mutateAsync({ id, form });
    },
    [updateMutation],
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  return {
    events,
    isLoading,
    error: queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load schedule') : null,
    createEvent,
    updateEvent,
    deleteEvent,
    refresh: refetch,
  };
}

// ── Reports ───────────────────────────────────────────────────────────────────

function escapeCsvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function csvLine(fields: Array<string | number>): string {
  return fields.map((f) => escapeCsvField(String(f))).join(',');
}

function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildAttendanceReportCsv(report: AttendanceReport): string {
  return [
    csvLine(['Metric', 'Value']),
    csvLine(['Period start', report.from]),
    csvLine(['Period end', report.to]),
    csvLine(['Total records', report.total]),
    csvLine(['Present', report.present]),
    csvLine(['Attendance rate (%)', report.rate]),
  ].join('\n');
}

function buildFinancialReportCsv(payments: PaymentsReport, debt: DebtReport): string {
  const lines = [
    csvLine(['Payments by status']),
    csvLine(['Status', 'Count', 'Total amount']),
    ...payments.byStatus.map((row) => csvLine([row.status, row.count, row.total])),
    '',
    csvLine(['Debtors', '', `Total debt: ${debt.totalDebt} ${debt.currency}`]),
    csvLine(['Student', 'Email', 'Phone', 'Debt amount', 'Overdue payments']),
    ...debt.items.map((item) =>
      csvLine([
        `${item.firstName} ${item.lastName}`.trim(),
        item.email,
        item.phone,
        item.debtAmount,
        item.overduePayments,
      ]),
    ),
  ];
  return lines.join('\n');
}

function buildPerformanceReportCsv(report: OperationalReport): string {
  return [
    csvLine(['Metric', 'Value']),
    csvLine(['Period start', report.period.from]),
    csvLine(['Period end', report.period.to]),
    csvLine(['New enrollments', report.newEnrollments]),
    csvLine(['Attendance rate (%)', report.attendanceRate]),
    csvLine(['Homework graded rate (%)', report.homeworkGradedRate]),
    csvLine(['Average exam score', report.avgExamScore]),
    csvLine(['Total revenue', report.totalRevenue]),
  ].join('\n');
}

export function useAdminReports() {
  const generateReport = useCallback(
    async (request: { type: ReportType; startDate: string; endDate: string }) => {
      const { type, startDate, endDate } = request;
      const params = { from: startDate, to: endDate };
      let csv: string;

      switch (type) {
        case 'attendance': {
          const report = await adminApi.getAttendanceReport(params);
          csv = buildAttendanceReportCsv(report);
          break;
        }
        case 'financial': {
          const [payments, debt] = await Promise.all([
            adminApi.getPaymentsReport(params),
            adminApi.getDebtReport(),
          ]);
          csv = buildFinancialReportCsv(payments, debt);
          break;
        }
        case 'performance': {
          const report = await adminApi.getOperationalReport(params);
          csv = buildPerformanceReportCsv(report);
          break;
        }
      }

      downloadCsv(csv, `report-${type}-${startDate}-to-${endDate}.csv`);
    },
    [],
  );

  return { generateReport };
}

// ── Settings ──────────────────────────────────────────────────────────────────

const DEFAULT_TENANT_CONFIG: TenantConfig = {
  academyName: '',
  logoUrl: null,
  timezone: 'Asia/Tashkent',
  currency: 'UZS',
  primaryColor: '#4F46E5',
  features: {
    payments: true,
    chat: false,
    certificates: true,
    exams: false,
  },
};

/** Check if the API response is a valid TenantConfig (not an error object) */
function isValidTenantConfig(value: unknown): value is TenantConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  // Must have academyName string field (error objects have "message")
  return typeof obj['academyName'] === 'string';
}

export function useAdminSettings() {
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [pricing, setPricing] = useState<PricingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/settings/config')
        .then((r) => {
          if (!r.ok) throw new Error(`Config fetch failed (${r.status})`);
          return r.json() as Promise<unknown>;
        })
        .then((data) => {
          // ✅ FIX: Validate config shape before using it
          if (isValidTenantConfig(data)) return data;
          return null;
        })
        .catch(() => null),

      fetch('/api/admin/settings/pricing')
        .then((r) => {
          if (!r.ok) throw new Error(`Pricing fetch failed (${r.status})`);
          return r.json() as Promise<unknown>;
        })
        .then((data) => ensureArray<PricingEntry>(data))
        .catch(() => [] as PricingEntry[]),
    ])
      .then(([cfg, prices]) => {
        setConfig(cfg);
        setPricing(prices);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load settings');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const saveConfig = useCallback(async (cfg: TenantConfig) => {
    const r = await fetch('/api/admin/settings/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    if (!r.ok) throw new Error(`Config save failed (${r.status})`);
    setConfig(cfg);
  }, []);

  const updatePrice = useCallback(
    async (id: string, price: number, currency: string) => {
      const r = await fetch(`/api/admin/settings/pricing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price, currency }),
      });
      if (!r.ok) throw new Error(`Price update failed (${r.status})`);
      setPricing((prev) =>
        prev.map((p) => (p.id === id ? { ...p, price, currency } : p)),
      );
    },
    [],
  );

  const deletePrice = useCallback(async (id: string) => {
    const r = await fetch(`/api/admin/settings/pricing/${id}`, { method: 'DELETE' });
    if (!r.ok) throw new Error(`Price reset failed (${r.status})`);
    setPricing((prev) => prev.map((p) => (p.id === id ? { ...p, price: 0 } : p)));
  }, []);

  return {
    config,
    pricing,
    isLoading,
    error,
    saveConfig,
    updatePrice,
    deletePrice,
    defaultConfig: DEFAULT_TENANT_CONFIG,
  };
}

// ── Notification preferences ───────────────────────────────────────────────────

export function useAdminNotificationPreferences() {
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/settings/notifications')
      .then((r) => {
        if (!r.ok) throw new Error(`Notifications fetch failed (${r.status})`);
        return r.json() as Promise<unknown>;
      })
      .then((data) => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setPreferences(data as Record<string, boolean>);
        }
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, []);

  const savePreferences = useCallback(async (next: Record<string, boolean>) => {
    await fetch('/api/admin/settings/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: next }),
    });
    setPreferences((prev) => ({ ...prev, ...next }));
  }, []);

  return { preferences, isLoading, savePreferences };
}
