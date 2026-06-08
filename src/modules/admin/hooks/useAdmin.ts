// src/modules/admin/hooks/useAdmin.ts
// ✅ FIX: Added try/catch to ALL hooks, validate API responses are arrays/objects before use

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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Ensure value is a proper array, not an error object */
function ensureArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  return [];
}

/** Ensure value is a proper object with specific key, not an error response */
function isValidObject(value: unknown, requiredKey: string): boolean {
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
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);

    fetch('/api/admin/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load dashboard (${r.status})`);
        return r.json() as Promise<BackendAdminDashboard>;
      })
      .then((raw) => {
        // Validate the response is an object with expected fields
        if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
          throw new Error('Invalid dashboard data received');
        }
        setData(mapBackendAdminDashboard(raw));
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Unknown error');
        setData(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, isLoading, error, refresh: load };
}

// ── Courses ───────────────────────────────────────────────────────────────────

export function useAdminCourses() {
  const [courses, setCourses] = useState<CourseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/courses');
      if (!res.ok) throw new Error(`Failed to load courses (${res.status})`);
      const data = (await res.json()) as unknown;
      // ✅ FIX: Validate it's actually an array before setting state
      setCourses(ensureArray<CourseDto>(data));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load courses');
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const deleteCourse = useCallback(
    async (id: string) => {
      await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
      setCourses((prev) => prev.filter((c) => c.id !== id));
    },
    [],
  );

  return { courses, isLoading, error, deleteCourse, refresh: load };
}

// ── Teachers ──────────────────────────────────────────────────────────────────

export function useAdminTeachers() {
  const [teachers, setTeachers] = useState<TeacherDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/teachers');
      if (!res.ok) throw new Error(`Failed to load teachers (${res.status})`);
      const data = (await res.json()) as unknown;
      // ✅ FIX: Validate it's actually an array before setting state
      setTeachers(ensureArray<TeacherDto>(data));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load teachers');
      setTeachers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleStatus = useCallback(
    async (id: string, status: 'active' | 'inactive') => {
      await fetch(`/api/admin/teachers/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setTeachers((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status } : t)),
      );
    },
    [],
  );

  return { teachers, isLoading, error, toggleStatus, refresh: load };
}

// ── Students ──────────────────────────────────────────────────────────────────

export function useAdminStudents() {
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/students');
      if (!res.ok) throw new Error(`Failed to load students (${res.status})`);
      const data = (await res.json()) as unknown;
      // ✅ FIX: Validate it's actually an array before setting state
      setStudents(ensureArray<StudentDto>(data));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load students');
      setStudents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleStatus = useCallback(
    async (id: string, status: 'active' | 'inactive') => {
      await fetch(`/api/admin/students/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status } : s)),
      );
    },
    [],
  );

  return { students, isLoading, error, toggleStatus, refresh: load };
}

// ── Schedule ──────────────────────────────────────────────────────────────────

export function useAdminSchedule() {
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/schedule');
      if (!res.ok) throw new Error(`Failed to load schedule (${res.status})`);
      const data = (await res.json()) as unknown;
      // ✅ FIX: Validate it's actually an array before setting state
      setEvents(ensureArray<ScheduleEvent>(data));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load schedule');
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const deleteEvent = useCallback(async (id: string) => {
    await fetch(`/api/admin/schedule/${id}`, { method: 'DELETE' });
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { events, isLoading, error, deleteEvent, refresh: load };
}

// ── Reports ───────────────────────────────────────────────────────────────────

export function useAdminReports() {
  const [recentReports, setRecentReports] = useState<ReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/reports/recent')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load reports (${r.status})`);
        return r.json() as Promise<unknown>;
      })
      .then((data) => {
        // ✅ FIX: Validate it's actually an array before setting state
        setRecentReports(ensureArray<ReportRecord>(data));
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Failed to load reports');
        setRecentReports([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const generateReport = useCallback(
    async (
      request: { type: string; startDate: string; endDate: string },
      format: string,
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
      link.download = `report-${request.type}-${Date.now()}.${
        format.toLowerCase() === 'excel' ? 'xlsx' : format.toLowerCase()
      }`;
      link.click();
      URL.revokeObjectURL(url);
    },
    [],
  );

  return { recentReports, isLoading, error, generateReport };
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
    await fetch('/api/admin/settings/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    setConfig(cfg);
  }, []);

  const updatePrice = useCallback(
    async (id: string, price: number, currency: string) => {
      await fetch(`/api/admin/settings/pricing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price, currency }),
      });
      setPricing((prev) =>
        prev.map((p) => (p.id === id ? { ...p, price, currency } : p)),
      );
    },
    [],
  );

  const deletePrice = useCallback(async (id: string) => {
    await fetch(`/api/admin/settings/pricing/${id}`, { method: 'DELETE' });
    setPricing((prev) => prev.filter((p) => p.id !== id));
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
