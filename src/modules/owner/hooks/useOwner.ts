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

// FIX: BackendKpis interfeysi kengaytirildi.
// Backend /owner/dashboard endi totalBranches, activeCourses, monthlyEnrollments,
// mrr, arr, trends fieldlarini ham qaytaradi (owner.service.ts fix dan keyin).
// Bu interfeys ham yangilandi — yangi fieldlarni o'qib GlobalKPIData ga map qiladi.
interface BackendKpis {
  // Legacy fields
  monthlyRevenue?: number;
  activeStudents?: number;
  teacherCount?: number;
  attendanceRate?: number;
  completionRate?: number;
  revenueChangePercent?: number;
  // NEW fields (owner.service.ts fix qilinganidan keyin)
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
  // metadata JSONB - salary, contractStatus, hireDate backend tomonidan shu yerda saqlanadi
  metadata?: Record<string, unknown> | null;
}

// Backend GET /api/v1/owner/branches returns BranchResponseDto[]:
// [{ id, name, address, phone, managerId, managerName, isActive, studentCount, teacherCount, createdAt }]
interface BackendBranchRow {
  id: string;
  name?: string;
  address?: string | null;
  phone?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  isActive?: boolean;
  is_active?: boolean;
  status?: string;
  studentCount?: number;
  student_count?: number;
  teacherCount?: number;
  teacher_count?: number;
  courseCount?: number;
  monthlyRevenue?: number;
  monthly_revenue?: number;
  currency?: string;
  createdAt?: string;
  created_at?: string;
}

function mapBranchRowToDto(b: BackendBranchRow): BranchDto {
  // isActive field: backend BranchResponseDto uses isActive boolean
  const isActive =
    b.isActive === true ||
    b.is_active === true ||
    b.status === 'active';

  return {
    id:             b.id ?? '',
    name:           b.name ?? '',
    address:        b.address ?? '',
    managerId:      b.managerId ?? null,
    managerName:    b.managerName ?? null,
    studentCount:   b.studentCount ?? b.student_count ?? 0,
    teacherCount:   b.teacherCount ?? b.teacher_count ?? 0,
    courseCount:    b.courseCount ?? 0,
    monthlyRevenue: b.monthlyRevenue ?? b.monthly_revenue ?? 0,
    currency:       b.currency ?? 'UZS',
    // FIX: status to'g'ri aniqlash - isActive boolean dan
    status:         isActive ? 'active' : 'inactive',
    createdAt:
      b.createdAt ??
      b.created_at ??
      new Date().toISOString(),
  };
}

// FIX: mapBackendKpisToGlobalKPIData yangilandi.
// Endi backend /owner/dashboard endi to'liq KPI qaytaradi:
// totalBranches, activeCourses, monthlyEnrollments, mrr, arr, trends.
// Mapper avval yangi fieldlarni tekshiradi (trends field mavjudligi orqali),
// agar yangi format bo'lsa — to'g'ridan-to'g'ri ishlatadi.
// Agar eski format kelsa (legacy) — hisob-kitob orqali bajariladi.
function mapBackendKpisToGlobalKPIData(kpis: BackendKpis): GlobalKPIData {
  // NEW format check: agar totalBranches field mavjud bo'lsa, yangi backend javobini ishlatamiz
  if (kpis.totalBranches !== undefined || kpis.trends !== undefined) {
    return {
      mrr:                kpis.mrr ?? kpis.monthlyRevenue ?? 0,
      arr:                kpis.arr ?? (kpis.mrr ?? kpis.monthlyRevenue ?? 0) * 12,
      totalUsers:         kpis.totalUsers ?? ((kpis.activeStudents ?? 0) + (kpis.teacherCount ?? 0)),
      // FIX ASOSIY: endi backend totalBranches qaytaradi → 0 emas, haqiqiy son ko'rinadi
      totalBranches:      kpis.totalBranches ?? 0,
      activeCourses:      kpis.activeCourses ?? 0,
      monthlyEnrollments: kpis.monthlyEnrollments ?? 0,
      revenueGrowthPercent: kpis.revenueGrowthPercent ?? kpis.revenueChangePercent ?? 0,
      trends: {
        mrrChange:         kpis.trends?.mrrChange ?? 0,
        usersChange:       kpis.trends?.usersChange ?? 0,
        enrollmentsChange: kpis.trends?.enrollmentsChange ?? 0,
      },
    };
  }

  // Legacy format (eski backend versiyasi uchun fallback)
  const monthlyRevenue = kpis.monthlyRevenue ?? 0;
  const revenueChange = kpis.revenueChangePercent ?? 0;

  return {
    mrr: monthlyRevenue,
    arr: monthlyRevenue * 12,
    totalUsers: (kpis.activeStudents ?? 0) + (kpis.teacherCount ?? 0),
    totalBranches: 0, // Legacy formatda bu ma'lumot yo'q
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
//
// BUG FIX: Backend users.branch maydoni — bu branch NOMI (masalan "Main Branch"),
// lekin getBranches endpointi branch UUID id qaytaradi.
// HRPanel filtri branchId (UUID) bilan solishtiradi → "Main Branch" !== UUID → hech kim chiqmaydi.
// Yechim: branches ro'yxatini qabul qilib, nom orqali to'g'ri UUID id ni topamiz.
function mapBackendUserToStaffDto(
  user: BackendUserRow,
  branches: BackendBranchRow[],
): StaffDto | null {
  const role = user.role as string;
  if (role !== 'teacher' && role !== 'admin') return null;

  const firstName = user.first_name ?? user.firstName ?? '';
  const lastName = user.last_name ?? user.lastName ?? '';
  const name = `${firstName} ${lastName}`.trim() || user.email;

  // user.branch — bu matn nom (masalan "Main Branch") yoki NULL bo'lishi mumkin.
  // Muammo: DB da users.branch maydoni ko'pincha NULL (seed da o'rnatilmagan).
  // Yechim 1: branchId (UUID) bo'yicha to'g'ridan-to'g'ri topamiz.
  // Yechim 2: branch nomi bo'yicha topamiz.
  // Yechim 3: agar ikkalasi ham topilmasa va faqat 1 ta filial bo'lsa → default filial.
  const branchNameFromUser = user.branch ?? '';
  const matchedBranch =
    branches.find(
      (b) =>
        (user.branchId != null && user.branchId !== '' && b.id === user.branchId) ||
        (branchNameFromUser !== '' &&
          (b.name ?? '').toLowerCase() === branchNameFromUser.toLowerCase()),
    ) ??
    // Fallback: agar branch yo'q/null bo'lsa va yagona filial bo'lsa → uni ishlatamiz
    (branches.length === 1 ? branches[0] : undefined);

  const resolvedBranchId = matchedBranch?.id ?? user.branchId ?? user.branch ?? '';
  const resolvedBranchName = matchedBranch?.name ?? user.branchName ?? user.branch ?? 'Main Branch';

  return {
    id: user.id,
    name,
    role: role as 'teacher' | 'admin',
    branchId: resolvedBranchId,
    branchName: resolvedBranchName,
    // Maosh metadata JSONB dan o'qiymiz (backend uni metadata.salary da saqlaydi)
    // user.salary to'g'ridan-to'g'ri bo'lsa (eski format) — uni ishlatamiz
    salary: typeof user.salary === 'number'
      ? user.salary
      : (typeof user.metadata?.salary === 'number' ? user.metadata.salary : 0),
    currency: 'UZS',
    contractStatus: (user.contractStatus as StaffDto['contractStatus']) ?? 'active',
    hireDate:
      user.hireDate ??
      user.created_at ??
      user.createdAt ??
      new Date().toISOString(),
  };
}

// Maps BackendUserRow → UserDto (for the Users management page)
// The backend returns snake_case field names (first_name, last_name, last_login_at, created_at)
// while the frontend UserDto expects camelCase (name, lastLogin, createdAt).
// This mapper bridges that gap so the Users page shows all users correctly.
function mapBackendUserRowToUserDto(user: BackendUserRow): UserDto {
  const firstName = user.first_name ?? user.firstName ?? '';
  const lastName = user.last_name ?? user.lastName ?? '';
  const name = `${firstName} ${lastName}`.trim() || user.email;

  const lastLogin =
    user.last_login_at ?? user.lastLoginAt ?? null;
  const createdAt =
    user.created_at ?? user.createdAt ?? new Date().toISOString();

  // Normalise status: backend may send 'active'/'inactive' or UserStatus enum values
  const rawStatus = (user.status ?? 'active') as string;
  const status: 'active' | 'inactive' =
    rawStatus === 'inactive' ? 'inactive' : 'active';

  return {
    id: user.id,
    name,
    email: user.email,
    role: user.role as UserRole,
    status,
    lastLogin: lastLogin ? new Date(lastLogin).toISOString() : null,
    createdAt: new Date(createdAt).toISOString(),
    branchId: user.branchId ?? user.branch ?? null,
    branchName: user.branchName ?? null,
  };
}

// ── KPI ───────────────────────────────────────────────────────────────────────

// FIX: useOwnerKPI to'liq qayta yozildi.
// Muammo: avvalgi versiyada faqat /api/owner/dashboard so'rovi yuborilgan,
// va bu endpoint faqat eski KPI fieldlarni qaytargan (totalBranches yo'q edi).
// Natijada dashboard da "Branches: 0" ko'rinardi.
//
// Yechim: endi /api/owner/dashboard so'roviga qo'shimcha ravishda
// /api/owner/branches so'rovi ham yuboriladi (parallel Promise.all bilan).
// Branches soni branches array uzunligi orqali aniqlanadi.
// Bu ham eski backend (totalBranches qaytarmaydigan) ham yangi backend bilan ishlaydi.
export function useOwnerKPI() {
  const [data, setData] = useState<GlobalKPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Parallel so'rovlar: dashboard KPI + branches (totalBranches uchun)
        const [dashRes, branchRes] = await Promise.all([
          fetch('/api/owner/dashboard'),
          fetch('/api/owner/branches'),
        ]);

        if (cancelled) return;

        // Dashboard KPI parse
        let kpiData: GlobalKPIData | null = null;
        if (dashRes.ok) {
          const res = (await dashRes.json()) as { kpis?: BackendKpis } | BackendKpis;
          const raw: BackendKpis =
            (res as { kpis?: BackendKpis }).kpis !== undefined
              ? ((res as { kpis: BackendKpis }).kpis)
              : (res as BackendKpis);
          kpiData = mapBackendKpisToGlobalKPIData(raw);
        }

        if (cancelled) return;

        // Branches parse — totalBranches ni aniqlash uchun
        // Bu fallback: agar backend /dashboard da totalBranches qaytarmasa,
        // branches endpointidan hisoblaymiz
        let branchCount = 0;
        if (branchRes.ok) {
          const branchData = (await branchRes.json()) as unknown;
          if (Array.isArray(branchData)) {
            branchCount = (branchData as unknown[]).length;
          }
        }

        if (cancelled) return;

        if (kpiData !== null) {
          // Agar backend yangi format qaytarsa (totalBranches > 0 bo'lsa) — ishonib qolaveramiz.
          // Agar eski format qaytsa (totalBranches = 0 bo'lsa) — branches endpointdan override qilamiz.
          const finalData: GlobalKPIData = {
            ...kpiData,
            totalBranches:
              kpiData.totalBranches > 0
                ? kpiData.totalBranches  // yangi backend javobini ishlatamiz
                : branchCount,           // fallback: branches endpointdan
          };
          setData(finalData);
        } else if (branchCount > 0) {
          // Dashboard fail bo'lsa lekin branches kelsa — minimal data
          setData({
            mrr: 0,
            arr: 0,
            totalUsers: 0,
            totalBranches: branchCount,
            activeCourses: 0,
            monthlyEnrollments: 0,
            revenueGrowthPercent: 0,
            trends: { mrrChange: 0, usersChange: 0, enrollmentsChange: 0 },
          });
        } else {
          setData(null);
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
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
      if (!res.ok) {
        setBranches([]);
        return;
      }
      const data = (await res.json()) as unknown;
      // Backend returns BranchResponseDto[] (array directly, not paginated)
      const rawList: BackendBranchRow[] = Array.isArray(data) ? (data as BackendBranchRow[]) : [];
      const mapped: BranchDto[] = rawList.map(mapBranchRowToDto);
      setBranches(mapped);
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

    // FIX: Backend POST /owner/branches qaytaradi { branches: BranchDto[] }
    // Oxirgi branch - yangi yaratilgan branch
    const raw = (await res.json()) as Record<string, unknown>;

    // Backend manageBranches metodi { branches: BranchDto[] } qaytaradi
    // Yangi branch - bu arrayning oxirgi elementi
    if (raw['branches'] && Array.isArray(raw['branches'])) {
      const backendBranches = raw['branches'] as BackendBranchRow[];
      const mapped: BranchDto[] = backendBranches.map(mapBranchRowToDto);
      // Butun listni yangilash
      setBranches(mapped);
      return;
    }

    // Agar to'g'ridan-to'g'ri branch object qaytsa
    // FIX: Record<string, unknown> → unknown → BackendBranchRow (safe double cast)
    const created = mapBranchRowToDto(raw as unknown as BackendBranchRow);
    setBranches((prev) => [...prev, created]);
  }, []);

  const editBranch = useCallback(async (id: string, form: BranchForm) => {
    const res = await fetch(`/api/owner/branches/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...form }),
    });
    if (!res.ok) throw new Error('Failed to update branch');

    const raw = (await res.json()) as Record<string, unknown>;

    // Backend manageBranches metodi { branches: BranchDto[] } qaytaradi
    if (raw['branches'] && Array.isArray(raw['branches'])) {
      const backendBranches = raw['branches'] as BackendBranchRow[];
      const mapped: BranchDto[] = backendBranches.map(mapBranchRowToDto);
      setBranches(mapped);
      return;
    }

    // Agar to'g'ridan-to'g'ri branch object qaytsa
    // FIX: Record<string, unknown> → unknown → BackendBranchRow (safe double cast)
    const updated = mapBranchRowToDto({ id, ...raw } as unknown as BackendBranchRow);
    setBranches((prev) => prev.map((b) => (b.id === id ? updated : b)));
  }, []);

  const deactivateBranch = useCallback(async (id: string) => {
    // Backend da deactivate endpoint yo'q - POST /owner/branches bilan isActive=false junatiladi
    // Yoki frontend side only update qilish
    const res = await fetch('/api/owner/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: false }),
    });
    if (res.ok) {
      const raw = (await res.json()) as Record<string, unknown>;
      if (raw['branches'] && Array.isArray(raw['branches'])) {
        const backendBranches = raw['branches'] as BackendBranchRow[];
        const mapped: BranchDto[] = backendBranches.map(mapBranchRowToDto);
        setBranches(mapped);
        return;
      }
    }
    // Fallback: local state update
    setBranches((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'inactive' as const } : b)),
    );
  }, []);

  return { branches, isLoading, createBranch, editBranch, deactivateBranch, refresh: load };
}

// ── Users ─────────────────────────────────────────────────────────────────────

// FIX: useOwnerUsers real server-side pagination bilan qayta yozildi.
// Muammo: avvalgi versiya limit/page parametrsiz fetch qilardi (backend default=20 bilan).
// Natijada:
//   1. Barcha users bir sahifada ko'rinardi (11 ta user bo'lsa barchasi kelardi).
//   2. DataTable limit dropdown (10/25/50/100) ishlamardi — onLimitChange yo'q edi.
// Yechim:
//   - page va limit parametrlarini qabul qilamiz.
//   - Backend PaginatedResult<UserRow> { data, meta } ni to'liq parse qilamiz.
//   - paginationMeta ni qaytaramiz — DataTable uchun real page/total/limit.

export interface UsersPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UseOwnerUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
}

export function useOwnerUsers(options: UseOwnerUsersOptions = {}) {
  const { page = 1, limit = 10, search, role } = options;

  const [users, setUsers] = useState<UserDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paginationMeta, setPaginationMeta] = useState<UsersPaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build query string with real pagination params — backend supports page & limit
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (role) params.set('role', role);

      const res = await fetch(`/api/owner/users?${params.toString()}`);
      const data = (await res.json()) as unknown;

      // Backend returns PaginatedResult<UserRow> = { data: UserRow[], meta: { total, page, limit } }
      const rawList: BackendUserRow[] =
        Array.isArray((data as { data?: unknown }).data)
          ? ((data as { data: BackendUserRow[] }).data)
          : Array.isArray(data)
          ? (data as BackendUserRow[])
          : [];

      // Map snake_case backend fields → camelCase UserDto
      const mapped: UserDto[] = rawList.map(mapBackendUserRowToUserDto);
      setUsers(mapped);

      // Build real pagination meta from backend response
      const meta = (data as { meta?: { total?: number; page?: number; limit?: number } }).meta;
      const total = meta?.total ?? mapped.length;
      const currentPage = meta?.page ?? page;
      const currentLimit = meta?.limit ?? limit;
      const totalPages = Math.max(1, Math.ceil(total / currentLimit));

      setPaginationMeta({
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      });
    } catch {
      setUsers([]);
      setPaginationMeta((prev) => ({ ...prev, total: 0, totalPages: 1 }));
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, role]);

  useEffect(() => {
    void load();
  }, [load]);

  const changeRole = useCallback(async (userId: string, newRole: UserRole) => {
    await fetch(`/api/owner/users/${userId}/role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  }, []);

  const toggleStatus = useCallback(async (userId: string, status: 'active' | 'inactive') => {
    await fetch(`/api/owner/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
  }, []);

  return { users, isLoading, paginationMeta, changeRole, toggleStatus, refresh: load };
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
//
// BUG FIX: users.branch — bu matn nom (masalan "Main Branch").
// Filtr UUID bilan ishlashi uchun avval branches ro'yxatini yuklab,
// keyin har bir staff uchun branchId ni nom orqali topamiz.

export function useOwnerHR() {
  const [staff, setStaff] = useState<StaffDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadStaff = useCallback(async () => {
    setIsLoading(true);
    try {
      // Barcha kerakli ma'lumotlarni parallel yuklaymiz:
      // teachers, admins va branches (branchId ni aniqlash uchun)
      const [teacherRes, adminRes, branchRes] = await Promise.all([
        fetch('/api/owner/users?role=teacher&limit=100'),
        fetch('/api/owner/users?role=admin&limit=100'),
        fetch('/api/owner/branches'),
      ]);

      const teacherData = (await teacherRes.json()) as unknown;
      const adminData = (await adminRes.json()) as unknown;
      const branchData = (await branchRes.json()) as unknown;

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

      // branches ro'yxati: nom → id moslashtirish uchun
      const branches: BackendBranchRow[] = Array.isArray(branchData)
        ? (branchData as BackendBranchRow[])
        : [];

      const allRows = [...teacherRows, ...adminRows];
      const mapped: StaffDto[] = allRows
        .map((u) => mapBackendUserToStaffDto(u, branches))
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
    // Backend POST /owner/hr endpoint - 'update_salary' operatsiyasi
    // Maosh metadata JSONB da saqlanadi (users jadvalida alohida salary column yo'q)
    const res = await fetch('/api/owner/hr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: staffId,
        operation: 'update_salary',
        salary,
      }),
    });
    if (!res.ok) {
      throw new Error('Failed to update salary');
    }
    // Local state ni yangilaymiz (sahifani qayta yuklamasdan ko'rinadi)
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