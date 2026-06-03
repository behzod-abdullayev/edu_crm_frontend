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

// ── KPI ───────────────────────────────────────────────────────────────────────

// Backend { kpis: { monthlyRevenue, activeStudents, teacherCount, attendanceRate, completionRate } }
// formatidan frontend GlobalKPIData formatiga mapper
interface BackendKpis {
  monthlyRevenue?: number;
  activeStudents?: number;
  teacherCount?: number;
  attendanceRate?: number;
  completionRate?: number;
  revenueChangePercent?: number;
  // Owner dashboard extended fields
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

function mapBackendKpisToGlobalKPIData(kpis: BackendKpis): GlobalKPIData {
  // Agar backend allaqachon to'liq GlobalKPIData formatida bo'lsa
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

  // Backend oddiy KPI formatida bo'lsa (monthlyRevenue, activeStudents, ...)
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

export function useOwnerKPI() {
  const [data, setData] = useState<GlobalKPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/owner/dashboard')
      .then((r) => r.json())
      .then((res) => {
        // Backend { kpis: {...} } formatida qaytaradi
        const raw: BackendKpis = res.kpis ?? res;
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
      const data = await res.json();
      setBranches(Array.isArray(data) ? data : []);
    } catch {
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

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
      prev.map((b) => (b.id === id ? { ...b, status: 'inactive' } : b))
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
      const data = await res.json();
      setUsers(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

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
      .then((data) => setMatrix(Array.isArray(data) ? { roles: data } as unknown as PermissionMatrix : data))
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
      .then((data) => setOverview(data as FinancialOverview))
      .catch(() => setOverview(null))
      .finally(() => setIsLoading(false));
  }, []);

  const exportReport = useCallback(async (format: 'pdf' | 'excel') => {
    const res = await fetch(`/api/owner/export/${format === 'excel' ? 'students' : 'students'}`);
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
    link.click();
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
      .then((data) => setChartData(data as MultiTenantChartData))
      .catch(() => setChartData(null))
      .finally(() => setIsLoading(false));
  }, []);

  return { chartData, isLoading };
}

// ── HR ────────────────────────────────────────────────────────────────────────

export function useOwnerHR() {
  const [staff, setStaff] = useState<StaffDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/owner/users')
      .then((r) => r.json())
      .then((data) => setStaff(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []))
      .catch(() => setStaff([]))
      .finally(() => setIsLoading(false));
  }, []);

  const updateSalary = useCallback(async (staffId: string, salary: number) => {
    await fetch(`/api/owner/hr/staff/${staffId}/salary`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salary }),
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
      .then(([cfg, hlth]) => {
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