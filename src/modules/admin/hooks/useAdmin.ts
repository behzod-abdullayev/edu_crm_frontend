import { useState, useEffect, useCallback } from 'react';
import {
  AdminDashboardData,
  ChartDataPoint,
  GroupAttendance,
  DebtBreakdown,
  DashboardTrends,
  ActivityItem,
  CourseDto,
  TeacherDto,
  StudentDto,
  ScheduleEvent,
  ReportRecord,
  TenantConfig,
  PricingEntry,
} from '../types/admin.types';

// ── Dashboard ─────────────────────────────────────────────────────────────────

// Backend AdminDashboardDto -> Frontend AdminDashboardData mapper
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
  recentActivities?: Array<{ id: string; type: string; description: string; actorName?: string | null; actor?: string; timestamp: string }>;
  recentActivity?: ActivityItem[];
  revenueHistory?: ChartDataPoint[];
  enrollmentHistory?: ChartDataPoint[];
  attendanceByGroup?: GroupAttendance[];
  debtBreakdown?: DebtBreakdown;
  trends?: DashboardTrends;
}

function mapBackendAdminDashboard(raw: BackendAdminDashboard): AdminDashboardData {
  // Already in correct format
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
    recentActivity: raw.recentActivity ?? (raw.recentActivities ?? []).map((a) => ({
      id: a.id,
      type: (['payment', 'enrollment', 'event'].includes(a.type) ? a.type : 'event') as ActivityItem['type'],
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
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/admin/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load dashboard');
        return r.json() as Promise<BackendAdminDashboard>;
      })
      .then((raw) => setData(mapBackendAdminDashboard(raw)))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Unknown error'))
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading, error };
}

// ── Courses ───────────────────────────────────────────────────────────────────

export function useAdminCourses() {
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch('/api/admin/courses');
    const data = (await res.json()) as CourseDto[];
    setCourses(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const deleteCourse = useCallback(async (id: string) => {
    await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { courses, isLoading, deleteCourse, refresh: load };
}

// ── Teachers ──────────────────────────────────────────────────────────────────

export function useAdminTeachers() {
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch('/api/admin/teachers');
    const data = (await res.json()) as TeacherDto[];
    setTeachers(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleStatus = useCallback(async (id: string, status: 'active' | 'inactive') => {
    await fetch(`/api/admin/teachers/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setTeachers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );
  }, []);

  return { teachers, isLoading, toggleStatus, refresh: load };
}

// ── Students ──────────────────────────────────────────────────────────────────

export function useAdminStudents() {
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch('/api/admin/students');
    const data = (await res.json()) as StudentDto[];
    setStudents(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const toggleStatus = useCallback(async (id: string, status: 'active' | 'inactive') => {
    await fetch(`/api/admin/students/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  }, []);

  return { students, isLoading, toggleStatus, refresh: load };
}

// ── Schedule ──────────────────────────────────────────────────────────────────

export function useAdminSchedule() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch('/api/admin/schedule');
    const data = (await res.json()) as ScheduleEvent[];
    setEvents(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const deleteEvent = useCallback(async (id: string) => {
    await fetch(`/api/admin/schedule/${id}`, { method: 'DELETE' });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { events, isLoading, deleteEvent, refresh: load };
}

// ── Reports ───────────────────────────────────────────────────────────────────

export function useAdminReports() {
  const [recentReports, setRecentReports] = useState<ReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/reports/recent')
      .then((r) => r.json() as Promise<ReportRecord[]>)
      .then(setRecentReports)
      .finally(() => setIsLoading(false));
  }, []);

  const generateReport = useCallback(
    async (
      request: { type: string; startDate: string; endDate: string },
      format: string
    ) => {
      const res = await fetch(`/api/admin/reports/${request.type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, format }),
      });
      if (!res.ok) throw new Error('Report generation failed');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${request.type}-${Date.now()}.${format.toLowerCase() === 'excel' ? 'xlsx' : format.toLowerCase()}`;
      link.click();
      URL.revokeObjectURL(url);
    },
    []
  );

  return { recentReports, isLoading, generateReport };
}

// ── Settings ──────────────────────────────────────────────────────────────────

export function useAdminSettings() {
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [pricing, setPricing] = useState<PricingEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/settings/config').then((r) => r.json() as Promise<TenantConfig>),
      fetch('/api/admin/settings/pricing').then((r) => r.json() as Promise<PricingEntry[]>),
    ])
      .then(([cfg, prices]) => {
        setConfig(cfg);
        setPricing(prices);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const saveConfig = useCallback(async (cfg: TenantConfig) => {
    await fetch('/api/admin/settings/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    setConfig(cfg);
  }, []);

  const updatePrice = useCallback(async (id: string, price: number, currency: string) => {
    await fetch(`/api/admin/settings/pricing/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price, currency }),
    });
    setPricing((prev) =>
      prev.map((p) => (p.id === id ? { ...p, price, currency } : p))
    );
  }, []);

  const deletePrice = useCallback(async (id: string) => {
    await fetch(`/api/admin/settings/pricing/${id}`, { method: 'DELETE' });
    setPricing((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { config, pricing, isLoading, saveConfig, updatePrice, deletePrice };
}