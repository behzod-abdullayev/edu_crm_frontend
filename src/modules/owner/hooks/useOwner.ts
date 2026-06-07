import { useState, useEffect, useCallback } from 'react';
import {
  GlobalKPIData,
  BranchDto,
  BranchForm,
  UserDto,
  UserRole,
  PermissionMatrix,
  StaffDto,
  FinancialOverview,
  MultiTenantChartData,
  SystemConfig,
  SystemHealth,
} from '../types/owner.types';

// ── Types that match the actual backend responses ─────────────────────────────

interface BackendKpis {
  monthlyRevenue?: number;
  activeStudents?: number;
  teacherCount?: number;
  attendanceRate?: number;
  completionRate?: number;
  revenueChangePercent?: number;
  mrr?: number;
  arr?: number;
  totalUsers?: number;
  totalBranches?: number;
  activeCourses?: number;
  monthlyEnrollments?: number;
  revenueGrowthPercent?: number;
  trends?: {
    mrrChange?: number;
    usersChange?: number;
    enrollmentsChange?: number;
  };
}

// Backend GET /api/v1/owner/analytics/global returns GlobalAnalyticsDto:
// { totalRevenue, totalStudents, totalTeachers, totalCourses, activeGroups,
//   attendanceRate, revenueByMonth: [{month, amount}], studentGrowth: [{month, count}],
//   topCourses, branchComparison: [], userGrowth: [] }
interface BackendGlobalAnalytics {
  totalRevenue?: number;
  totalStudents?: number;
  totalTeachers?: number;
  totalCourses?: number;
  activeGroups?: number;
  attendanceRate?: number;
  revenueByMonth?: { month: string; amount: number }[];
  studentGrowth?: { month: string; count: number }[];
  topCourses?: { courseId: string; name: string; enrollmentCount: number; revenue: number }[];
  branchComparison?: { branchName: string; students: number; revenue: number; attendanceRate: number }[];
  userGrowth?: { month: string; students: number; teachers: number }[];
}

// Backend GET /api/v1/owner/users returns PaginatedResult<UserRow>:
// { data: [{id, first_name, last_name, email, phone, role, status, last_login_at, created_at, branch}],
//   meta: {total, page, limit} }
interface BackendUserRow {
  id: string;
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  role: string;
  status?: string;
  last_login_at?: string | null;
  lastLoginAt?: string | null;
  created_at?: string;
  createdAt?: string;
  branch?: string;
  branchId?: string | null;
  branchName?: string | null;
  salary?: number;
  contractStatus?: string;
  hireDate?: string;
}

function mapBackendKpisToGlobalKPIData(kpis: BackendKpis): GlobalKPIData {
  if (kpis.trends !== undefined) {
    return {
      mrr: kpis.mrr ?? 0,
      arr: kpis.arr ?? 0,
      totalUsers: kpis.totalUsers ?? 0,
      totalBranches: kpis.totalBranches ?? 0,
      activeCourses: kpis.activeCourses ?? 0,
      monthlyEnrollments: kpis.monthlyEnrollments ?? 0,
      revenueGrowthPercent: kpis.revenueGrowthPercent ?? 0,
      trends: {
        mrrChange: kpis.trends.mrrChange ?? 0,
        usersChange: kpis.trends.usersChange ?? 0,
        enrollmentsChange: kpis.trends.enrollmentsChange ?? 0,
      },
    };
  }

  const monthlyRevenue = kpis.monthlyRevenue ?? 0;
  const revenueChange = kpis.revenueChangePercent ?? 0;

  return {
    mrr: monthlyRevenue,
    arr: monthlyRevenue * 12,
    totalUsers: (kpis.activeStudents ?? 0) + (kpis.teacherCount ?? 0),
    totalBranches: 1,
    activeCourses: 0,
    monthlyEnrollments: 0,
    revenueGrowthPercent: kpis.completionRate ?? 0,
    trends: {
      mrrChange: revenueChange,
      usersChange: 0,
      enrollmentsChange: 0,
    },
  };
}

// Maps backend GlobalAnalyticsDto → frontend MultiTenantChartData
// Handles the field name mismatch: revenueByMonth[].amount → globalRevenue[].revenue
//                                  studentGrowth[].count → userGrowth[].count
//                                  branchComparison[]   → branchComparison[]
function mapBackendAnalyticsToChartData(data: BackendGlobalAnalytics): MultiTenantChartData {
  // globalRevenue: backend uses { month, amount }, frontend expects { month, revenue }
  const globalRevenue = (data.revenueByMonth ?? []).map((item) => ({
    month: item.month,
    revenue: item.amount,
  }));

  // userGrowth: backend returns [] or [{month, students, teachers}]
  // frontend expects [{month, count}] — sum students + teachers as total users
  const userGrowth = (data.userGrowth ?? []).map((item) => ({
    month: item.month,
    count: (item.students ?? 0) + (item.teachers ?? 0),
  }));

  // If userGrowth is empty but studentGrowth exists, use studentGrowth as fallback
  const userGrowthFallback =
    userGrowth.length === 0
      ? (data.studentGrowth ?? []).map((item) => ({
          month: item.month,
          count: item.count,
        }))
      : userGrowth;

  // enrollmentTrends: backend doesn't provide this directly
  // Use studentGrowth as enrollment proxy
  const enrollmentTrends = (data.studentGrowth ?? []).map((item) => ({
    month: item.month,
    count: item.count,
  }));

  // branchComparison: backend returns BranchComparisonDto[] or []
  // Frontend BranchComparisonPoint requires { period: string; [branchName: string]: number | string }
  // Convert [{branchName, revenue, ...}] → [{ period: 'Current', [branchName]: revenue }]
  const branchComparison: MultiTenantChartData['branchComparison'] =
    (data.branchComparison ?? []).length > 0
      ? (() => {
          // BranchComparisonPoint: period is required string + index signature
          const row: { period: string; [key: string]: number | string } = { period: 'Current' };
          for (const b of data.branchComparison ?? []) {
            row[b.branchName] = b.revenue;
          }
          return [row];
        })()
      : [];

  return {
    globalRevenue,
    userGrowth: userGrowthFallback,
    enrollmentTrends,
    branchComparison,
  };
}

// Maps BackendUserRow to StaffDto (for HR panel)
// Only users with role 'teacher' or 'admin' are included as staff
function mapBackendUserToStaffDto(user: BackendUserRow): StaffDto | null {
  const role = user.role as string;
  if (role !== 'teacher' && role !== 'admin') return null;

  const firstName = user.first_name ?? user.firstName ?? '';
  const lastName = user.last_name ?? user.lastName ?? '';
  const name = `${firstName} ${lastName}`.trim() || user.email;

  return {
    id: user.id,
    name,
    role: role as 'teacher' | 'admin',
    branchId: user.branchId ?? user.branch ?? '',
    branchName: user.branchName ?? user.branch ?? 'Main Branch',
    salary: user.salary ?? 0,
    currency: 'UZS',
    contractStatus: (user.contractStatus as StaffDto['contractStatus']) ?? 'active',
    hireDate:
      user.hireDate ??
      user.created_at ??
      user.createdAt ??
      new Date().toISOString(),
  };
}

// ── KPI ───────────────────────────────────────────────────────────────────────

export function useOwnerKPI() {
  const [data, setData] = useState<GlobalKPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/owner/dashboard')
      .then((r) => r.json())
      .then((res) => {
        const raw: BackendKpis = (res as { kpis?: BackendKpis }).kpis ?? (res as BackendKpis);
        setData(mapBackendKpisToGlobalKPIData(raw));
      })
      .catch(() => setData(null))
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading };
}

// ── Branches ──────────────────────────────────────────────────────────────────

export function useOwnerBranches() {
  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/owner/branches');
      const data = (await res.json()) as unknown;
      setBranches(Array.isArray(data) ? (data as BranchDto[]) : []);
    } catch {
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const createBranch = useCallback(async (form: BranchForm) => {
    const res = await fetch('/api/owner/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) throw new Error('Failed to create branch');
    const created = (await res.json()) as BranchDto;
    setBranches((prev) => [...prev, created]);
  }, []);

  const editBranch = useCallback(async (id: string, form: BranchForm) => {
    const res = await fetch(`/api/owner/branches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) throw new Error('Failed to update branch');
    const updated = (await res.json()) as BranchDto;
    setBranches((prev) => prev.map((b) => (b.id === id ? updated : b)));
  }, []);

  const deactivateBranch = useCallback(async (id: string) => {
    await fetch(`/api/owner/branches/${id}/deactivate`, { method: 'PATCH' });
    setBranches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'inactive' } : b)),
    );
  }, []);

  return { branches, isLoading, createBranch, editBranch, deactivateBranch, refresh: load };
}

// ── Users ─────────────────────────────────────────────────────────────────────

export function useOwnerUsers() {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/owner/users');
      const data = (await res.json()) as unknown;
      const list =
        Array.isArray((data as { data?: unknown }).data)
          ? ((data as { data: UserDto[] }).data)
          : Array.isArray(data)
          ? (data as UserDto[])
          : [];
      setUsers(list);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const changeRole = useCallback(async (userId: string, role: UserRole) => {
    await fetch(`/api/owner/users/${userId}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
  }, []);

  const toggleStatus = useCallback(async (userId: string, status: 'active' | 'inactive') => {
    await fetch(`/api/owner/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
  }, []);

  return { users, isLoading, changeRole, toggleStatus, refresh: load };
}

// ── Roles ─────────────────────────────────────────────────────────────────────

export function useOwnerRoles() {
  const [matrix, setMatrix] = useState<PermissionMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/owner/roles')
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setMatrix({ roles: data as PermissionMatrix['roles'], allPermissions: [] });
        } else {
          setMatrix(data as PermissionMatrix);
        }
      })
      .catch(() => setMatrix(null))
      .finally(() => setIsLoading(false));
  }, []);

  const saveRole = useCallback(async (roleId: string, permissions: string[]) => {
    await fetch(`/api/owner/roles/${roleId}/permissions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissions }),
    });
  }, []);

  return { matrix, isLoading, saveRole };
}

// ── Finances ──────────────────────────────────────────────────────────────────

export function useOwnerFinances() {
  const [overview, setOverview] = useState<FinancialOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/owner/analytics/financial')
      .then((r) => r.json())
      .then((data: unknown) => setOverview(data as FinancialOverview))
      .catch(() => setOverview(null))
      .finally(() => setIsLoading(false));
  }, []);

  // Export report: calls /api/owner/export/:type which proxies to backend
  // Backend endpoint: GET /api/v1/owner/export/:type (students | payments | attendance)
  const exportReport = useCallback(async (format: 'pdf' | 'excel') => {
    // Backend only supports Excel export via /owner/export/:type
    // Use 'payments' as the financial report type
    const exportType = format === 'excel' ? 'payments' : 'payments';
    const res = await fetch(`/api/owner/export/${exportType}`);
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const sendOverdueReminders = useCallback(async () => {
    await fetch('/api/owner/finances/send-reminders', { method: 'POST' });
  }, []);

  return { overview, isLoading, exportReport, sendOverdueReminders };
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function useOwnerAnalytics() {
  const [chartData, setChartData] = useState<MultiTenantChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/owner/analytics/global')
      .then((r) => r.json())
      .then((data: unknown) => {
        // Backend returns GlobalAnalyticsDto with different field names than
        // MultiTenantChartData. Map them correctly to avoid slice() crashes.
        const mapped = mapBackendAnalyticsToChartData(data as BackendGlobalAnalytics);
        setChartData(mapped);
      })
      .catch(() => {
        // On error, set empty but valid structure so slice() never throws
        setChartData({
          globalRevenue: [],
          userGrowth: [],
          enrollmentTrends: [],
          branchComparison: [],
        });
      })
      .finally(() => setIsLoading(false));
  }, []);

  return { chartData, isLoading };
}

// ── HR ────────────────────────────────────────────────────────────────────────
// Backend endpoint: GET /api/v1/owner/users
// Returns: PaginatedResult<UserRow> = { data: UserRow[], meta: {...} }
// UserRow has: { id, first_name, last_name, email, role, status, branch, ... }
// We filter to only teacher + admin roles and map to StaffDto for HRPanel

export function useOwnerHR() {
  const [staff, setStaff] = useState<StaffDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch teachers
      const [teacherRes, adminRes] = await Promise.all([
        fetch('/api/owner/users?role=teacher&limit=100'),
        fetch('/api/owner/users?role=admin&limit=100'),
      ]);

      const teacherData = (await teacherRes.json()) as unknown;
      const adminData = (await adminRes.json()) as unknown;

      const teacherRows: BackendUserRow[] = Array.isArray(
        (teacherData as { data?: unknown }).data,
      )
        ? ((teacherData as { data: BackendUserRow[] }).data)
        : Array.isArray(teacherData)
        ? (teacherData as BackendUserRow[])
        : [];

      const adminRows: BackendUserRow[] = Array.isArray(
        (adminData as { data?: unknown }).data,
      )
        ? ((adminData as { data: BackendUserRow[] }).data)
        : Array.isArray(adminData)
        ? (adminData as BackendUserRow[])
        : [];

      const allRows = [...teacherRows, ...adminRows];
      const mapped: StaffDto[] = allRows
        .map(mapBackendUserToStaffDto)
        .filter((s): s is StaffDto => s !== null);

      setStaff(mapped);
    } catch {
      setStaff([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStaff();
  }, [loadStaff]);

  const updateSalary = useCallback(async (staffId: string, salary: number) => {
    // Backend uses POST /owner/hr for HR operations
    await fetch('/api/owner/hr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: staffId,
        operation: 'change_role',
        salary,
      }),
    });
    setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, salary } : s)));
  }, []);

  return { staff, isLoading, updateSalary };
}

// ── System ────────────────────────────────────────────────────────────────────

export function useOwnerSystem() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [apiVersion, setApiVersion] = useState('1.0.0');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/owner/system/config').then((r) => r.json()),
      fetch('/api/health').then((r) => r.json()),
    ])
      .then(([cfg, hlth]: [unknown, unknown]) => {
        setConfig(cfg as SystemConfig);
        setHealth(hlth as SystemHealth);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const saveConfig = useCallback(async (cfg: SystemConfig) => {
    await fetch('/api/owner/system/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    });
    setConfig(cfg);
  }, []);

  const clearCache = useCallback(async () => {
    await fetch('/api/owner/system/cache', { method: 'DELETE' });
  }, []);

  const triggerBackup = useCallback(async () => {
    await fetch('/api/owner/system/backup', { method: 'POST' });
  }, []);

  return { config, health, apiVersion, isLoading, saveConfig, clearCache, triggerBackup };
}
