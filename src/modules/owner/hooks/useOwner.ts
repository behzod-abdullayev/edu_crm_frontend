'use client';
// src/modules/owner/hooks/useOwner.ts
//
// ✅ ALL hooks use TanStack Query v5 (useQuery / useMutation)
// ✅ queryKeys from keys.factory.ts used throughout
// ✅ httpClient (axios instance) used for all requests — no raw fetch()
// ✅ Mapper logic preserved — all backend ↔ frontend transformations intact
// ✅ Optimistic updates + targeted cache invalidation on mutations
// ✅ staleTime / gcTime / retry settings match global config
// ✅ useOwnerUsers: sortBy/sortOrder support + optimistic update + rollback
// ✅ useOwnerRoles: createRole mutation + addToast notifications
// ✅ useOwnerKPI: totalBranches fallback from /branches endpoint
// ✅ KPI sparklines derived from revenueByMonth / userGrowth when available

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { httpClient } from '@/services/api/axios.instance';
import { ownerApi } from '@/services/api/owner.api';
import { queryKeys } from '@/services/query/keys.factory';
import { useUIStore } from '@/store/ui.store';
import { parseApiError } from '@/shared/utils/api-error';
import type {
  GlobalKPIData,
  BranchDto,
  BranchForm,
  UserDto,
  UserRole,
  PermissionMatrix,
  StaffDto,
  FinancialOverview,
  MultiTenantChartData,
} from '../types/owner.types';

// ── Query defaults ─────────────────────────────────────────────────────────────

const QUERY_DEFAULTS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  retry: 2,
  retryDelay: (n: number) => Math.min(1000 * 2 ** n, 30_000),
  refetchOnWindowFocus: false,
  refetchOnMount: true,
} as const;

// ── Backend response interfaces ────────────────────────────────────────────────

// Backend /owner/dashboard qaytaradigan KPI fieldlari.
// Legacy fields (eski backend) + NEW fields (yangi backend) ikkalasini ham qabul qiladi.
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
  // Sparkline arrays (optional — backend qo'shganda mavjud)
  revenueByMonth?: { month: string; amount: number }[];
  userGrowth?: { month: string; count: number }[];
  studentGrowth?: { month: string; count: number }[];
}

// Backend GET /api/v1/owner/analytics/global returns GlobalAnalyticsDto
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

// Backend GET /api/v1/owner/users returns PaginatedResult<UserRow>
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
  // metadata JSONB — salary, contractStatus, hireDate backend tomonidan shu yerda saqlanadi
  metadata?: Record<string, unknown> | null;
}

// Backend GET /api/v1/owner/branches returns BranchResponseDto[]
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

// ── Mapper functions ───────────────────────────────────────────────────────────

// Sparkline data yo'q bo'lganda trend foizidan sintetik sparkline hosil qiladi
function generateSparkline(currentValue: number, trendPct: number, points = 7): { value: number }[] {
  const step = (trendPct / 100) * currentValue / (points - 1);
  return Array.from({ length: points }, (_, i) => ({
    value: Math.max(0, currentValue - step * (points - 1 - i)),
  }));
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
    // status to'g'ri aniqlash — isActive boolean dan
    status:         isActive ? 'active' : 'inactive',
    createdAt:
      b.createdAt ??
      b.created_at ??
      new Date().toISOString(),
  };
}

// Backend /owner/dashboard → GlobalKPIData mapper.
// branchCount: /owner/branches endpointdan olingan filiallar soni (fallback uchun).
// Agar backend yangi format qaytarsa (totalBranches mavjud) — uni ishlatadi.
// Agar eski format kelsa — branchCount fallback sifatida ishlatiladi.
// Sparklines: revenueByMonth / userGrowth backenddan kelsa — ular ishlatiladi,
// aks holda trendPct dan sintetik sparkline generatsiya qilinadi.
function mapBackendKpisToGlobalKPIData(kpis: BackendKpis, branchCount = 0): GlobalKPIData {
  const useNewFormat = kpis.totalBranches !== undefined || kpis.trends !== undefined;

  let base: GlobalKPIData;

  if (useNewFormat) {
    const mrr = kpis.mrr ?? kpis.monthlyRevenue ?? 0;
    const totalUsers = kpis.totalUsers ?? ((kpis.activeStudents ?? 0) + (kpis.teacherCount ?? 0));
    const monthlyEnrollments = kpis.monthlyEnrollments ?? 0;
    base = {
      mrr,
      arr:                  kpis.arr ?? mrr * 12,
      totalUsers,
      // FIX: backend totalBranches qaytarsa — ishlatamiz, aks holda branches endpointdan
      totalBranches:        (kpis.totalBranches !== undefined && kpis.totalBranches > 0)
                              ? kpis.totalBranches
                              : branchCount,
      activeCourses:        kpis.activeCourses ?? 0,
      monthlyEnrollments,
      revenueGrowthPercent: kpis.revenueGrowthPercent ?? kpis.revenueChangePercent ?? 0,
      trends: {
        mrrChange:         kpis.trends?.mrrChange ?? 0,
        usersChange:       kpis.trends?.usersChange ?? 0,
        enrollmentsChange: kpis.trends?.enrollmentsChange ?? 0,
      },
    };
  } else {
    // Legacy format (eski backend versiyasi uchun fallback)
    const mrr = kpis.monthlyRevenue ?? 0;
    const totalUsers = (kpis.activeStudents ?? 0) + (kpis.teacherCount ?? 0);
    const mrrChange = kpis.revenueChangePercent ?? 0;
    base = {
      mrr,
      arr:                  mrr * 12,
      totalUsers,
      totalBranches:        branchCount,
      activeCourses:        0,
      monthlyEnrollments:   0,
      revenueGrowthPercent: kpis.completionRate ?? 0,
      trends: { mrrChange, usersChange: 0, enrollmentsChange: 0 },
    };
  }

  // Sparklines: backend revenueByMonth / userGrowth / studentGrowth dan hosil qilinadi
  const revenueMonths = kpis.revenueByMonth ?? [];
  const userMonths =
    kpis.userGrowth?.map((m) => ({ value: m.count })) ??
    kpis.studentGrowth?.map((m) => ({ value: m.count })) ??
    [];

  const mrrSparkline: { value: number }[] =
    revenueMonths.length >= 3
      ? revenueMonths.slice(-7).map((m) => ({ value: m.amount }))
      : generateSparkline(base.mrr, base.trends.mrrChange);

  const usersSparkline: { value: number }[] =
    userMonths.length >= 3
      ? userMonths.slice(-7)
      : generateSparkline(base.totalUsers, base.trends.usersChange);

  const enrollmentsSparkline: { value: number }[] =
    generateSparkline(base.monthlyEnrollments, base.trends.enrollmentsChange);

  return { ...base, mrrSparkline, usersSparkline, enrollmentsSparkline };
}

// Backend GlobalAnalyticsDto → frontend MultiTenantChartData mapper.
// Handles field name mismatch: revenueByMonth[].amount → globalRevenue[].revenue
//                               userGrowth[{students,teachers}] → userGrowth[{count}]
function mapBackendAnalyticsToChartData(data: BackendGlobalAnalytics): MultiTenantChartData {
  // globalRevenue: backend uses { month, amount }, frontend expects { month, revenue }
  const globalRevenue = (data.revenueByMonth ?? []).map((item) => ({
    month: item.month,
    revenue: item.amount,
  }));

  // userGrowth: backend returns [{month, students, teachers}]
  // frontend expects [{month, count}] — students + teachers as total users
  const userGrowth = (data.userGrowth ?? []).map((item) => ({
    month: item.month,
    count: (item.students ?? 0) + (item.teachers ?? 0),
  }));

  // userGrowth bo'sh bo'lsa studentGrowth fallback sifatida ishlatiladi
  const userGrowthFallback =
    userGrowth.length === 0
      ? (data.studentGrowth ?? []).map((item) => ({ month: item.month, count: item.count }))
      : userGrowth;

  // enrollmentTrends: backend to'g'ridan-to'g'ri bermaydi — studentGrowth proxy sifatida
  const enrollmentTrends = (data.studentGrowth ?? []).map((item) => ({
    month: item.month,
    count: item.count,
  }));

  // branchComparison: [{branchName, revenue, ...}] → [{ period: 'Current', [branchName]: revenue }]
  const branchComparison: MultiTenantChartData['branchComparison'] =
    (data.branchComparison ?? []).length > 0
      ? (() => {
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

// Maps BackendUserRow to StaffDto (for HR panel).
// Only teacher + admin roles are included as staff.
//
// BUG FIX: users.branch — bu branch NOMI (masalan "Main Branch"),
// lekin getBranches endpointi branch UUID id qaytaradi.
// HRPanel filtri branchId (UUID) bilan solishtiradi → nom !== UUID → hech kim chiqmaydi.
// Yechim: branches ro'yxatini qabul qilib, nom orqali to'g'ri UUID topamiz.
function mapBackendUserToStaffDto(
  user: BackendUserRow,
  branches: BackendBranchRow[],
): StaffDto | null {
  const role = user.role as string;
  if (role !== 'teacher' && role !== 'admin') return null;

  const firstName = user.first_name ?? user.firstName ?? '';
  const lastName = user.last_name ?? user.lastName ?? '';
  const name = `${firstName} ${lastName}`.trim() || user.email;

  // Yechim: branchId (UUID) → nom → yagona filial fallback tartibida izlaymiz
  const branchNameFromUser = user.branch ?? '';
  const matchedBranch =
    branches.find(
      (b) =>
        (user.branchId != null && user.branchId !== '' && b.id === user.branchId) ||
        (branchNameFromUser !== '' &&
          (b.name ?? '').toLowerCase() === branchNameFromUser.toLowerCase()),
    ) ??
    // Fallback: branch yo'q/null va yagona filial bo'lsa → uni ishlatamiz
    (branches.length === 1 ? branches[0] : undefined);

  const resolvedBranchId = matchedBranch?.id ?? user.branchId ?? user.branch ?? '';
  const resolvedBranchName = matchedBranch?.name ?? user.branchName ?? user.branch ?? 'Main Branch';

  return {
    id: user.id,
    name,
    role: role as 'teacher' | 'admin',
    branchId: resolvedBranchId,
    branchName: resolvedBranchName,
    // Maosh metadata JSONB dan o'qiymiz (users jadvalida alohida salary column yo'q)
    salary:
      typeof user.salary === 'number'
        ? user.salary
        : typeof user.metadata?.salary === 'number'
          ? user.metadata.salary
          : 0,
    currency: 'UZS',
    contractStatus: (user.contractStatus as StaffDto['contractStatus']) ?? 'active',
    hireDate:
      user.hireDate ??
      user.created_at ??
      user.createdAt ??
      new Date().toISOString(),
  };
}

// Maps BackendUserRow → UserDto (for Users management page).
// Backend returns snake_case (first_name, last_name, last_login_at, created_at),
// frontend UserDto expects camelCase (name, lastLogin, createdAt).
// super_admin roli ham UserRole ga to'g'ri map qilinadi (owner.types.ts fix bilan).
function mapBackendUserRowToUserDto(user: BackendUserRow): UserDto {
  const firstName = user.first_name ?? user.firstName ?? '';
  const lastName = user.last_name ?? user.lastName ?? '';
  const name = `${firstName} ${lastName}`.trim() || user.email;

  const lastLogin = user.last_login_at ?? user.lastLoginAt ?? null;
  const createdAt = user.created_at ?? user.createdAt ?? new Date().toISOString();

  // Normalise status: backend may send 'active'/'inactive' or UserStatus enum values
  const rawStatus = (user.status ?? 'active') as string;
  const status: 'active' | 'inactive' = rawStatus === 'inactive' ? 'inactive' : 'active';

  return {
    id: user.id,
    name,
    email: user.email,
    // super_admin ham UserRole ga kira oladi (owner.types.ts fix)
    role: user.role as UserRole,
    status,
    lastLogin: lastLogin ? new Date(lastLogin).toISOString() : null,
    createdAt: new Date(createdAt).toISOString(),
    branchId: user.branchId ?? user.branch ?? null,
    branchName: user.branchName ?? null,
  };
}

// ── KPI ───────────────────────────────────────────────────────────────────────
//
// FIXED: useOwnerKPI TanStack Query v5 useQuery bilan ishlaydi.
// /owner/dashboard + /owner/branches parallel so'rovlar — totalBranches fallback uchun.
// queryKey: queryKeys.owner.dashboard() — WebSocket invalidation bilan mos keladi.

export function useOwnerKPI() {
  return useQuery({
    queryKey: queryKeys.owner.dashboard(),
    queryFn: async (): Promise<GlobalKPIData> => {
      const [dashRes, branchRes] = await Promise.all([
        httpClient.get<BackendKpis | { kpis?: BackendKpis }>('/owner/dashboard'),
        httpClient.get<BackendBranchRow[]>('/owner/branches').catch(() => ({ data: [] })),
      ]);

      const raw: BackendKpis =
        (dashRes.data as { kpis?: BackendKpis }).kpis !== undefined
          ? ((dashRes.data as { kpis: BackendKpis }).kpis)
          : (dashRes.data as BackendKpis);

      const branchData = branchRes.data;
      const branchCount = Array.isArray(branchData) ? branchData.length : 0;

      return mapBackendKpisToGlobalKPIData(raw, branchCount);
    },
    ...QUERY_DEFAULTS,
  });
}

// ── Branches ──────────────────────────────────────────────────────────────────
//
// FIXED: useOwnerBranches TanStack Query v5 bilan.
// useQuery for list, useMutation for create/edit/deactivate with cache sync.
// Branch yaratilganda/o'chirilganda dashboard KPI ham invalidate qilinadi.

export function useOwnerBranches() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.owner.branches.lists(),
    queryFn: async (): Promise<BranchDto[]> => {
      const res = await httpClient.get<unknown>('/owner/branches');
      const rawList: BackendBranchRow[] = Array.isArray(res.data)
        ? (res.data as BackendBranchRow[])
        : [];
      return rawList.map(mapBranchRowToDto);
    },
    ...QUERY_DEFAULTS,
  });

  const createMutation = useMutation({
    mutationFn: async (form: BranchForm): Promise<BranchDto[]> => {
      const res = await httpClient.post<unknown>('/owner/branches', form);
      const raw = res.data as Record<string, unknown>;
      // Backend manageBranches metodi { branches: BranchDto[] } qaytaradi
      if (raw['branches'] && Array.isArray(raw['branches'])) {
        return (raw['branches'] as BackendBranchRow[]).map(mapBranchRowToDto);
      }
      // To'g'ridan-to'g'ri branch object qaytsa
      const created = mapBranchRowToDto(raw as unknown as BackendBranchRow);
      return [...(query.data ?? []), created];
    },
    onSuccess: (updatedBranches) => {
      queryClient.setQueryData(queryKeys.owner.branches.lists(), updatedBranches);
      // Dashboard KPI invalidate — totalBranches yangilanishi uchun
      void queryClient.invalidateQueries({ queryKey: queryKeys.owner.dashboard() });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string): Promise<BranchDto[]> => {
      // Backend da alohida deactivate endpoint yo'q — POST bilan isActive:false junatiladi
      await httpClient.post<unknown>('/owner/branches', { id, isActive: false }).catch(() => null);
      return (query.data ?? []).map((b) =>
        b.id === id ? { ...b, status: 'inactive' as const } : b,
      );
    },
    onSuccess: (updatedBranches) => {
      queryClient.setQueryData(queryKeys.owner.branches.lists(), updatedBranches);
    },
  });

  return {
    branches:         query.data ?? [],
    isLoading:        query.isLoading,
    isError:          query.isError,
    createBranch:     (form: BranchForm) => createMutation.mutateAsync(form),
    deactivateBranch: (id: string) => deactivateMutation.mutateAsync(id),
    refresh:          () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.owner.branches.lists() }),
    isCreating:       createMutation.isPending,
    isDeactivating:   deactivateMutation.isPending,
  };
}

// ── Users ─────────────────────────────────────────────────────────────────────
//
// FIXED: useOwnerUsers TanStack Query v5 + real server-side pagination.
//
// FIX 1: useQuery — barcha server ma'lumotlari TanStack Query orqali.
//         avval useState + useEffect + fetch() edi.
//
// FIX 2: changeRole useMutation + optimistic update + rollback.
//   - onMutate: darhol cache ni yangilaydi (foydalanuvchi darhol ko'radi)
//   - onError: API xato qaytarsa cache oldingi holatga qaytadi (rollback)
//   - onSuccess: invalidateQueries — server dan yangi ma'lumot olinadi
//
// FIX 3: super_admin roli UserRole type ga qo'shildi (owner.types.ts da).
//
// FIX 4: sortBy/sortOrder parametrlari qo'shildi — DataTable sorting uchun.

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
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface UsersQueryResult {
  users: UserDto[];
  meta: UsersPaginationMeta;
}

export function useOwnerUsers(options: UseOwnerUsersOptions = {}) {
  const { page = 1, limit = 10, search, role, sortBy, sortOrder } = options;
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const query = useQuery({
    // FIX XATO 7: queryKeys.owner.users.list() ishlatiladi (avval queryKeys.owner.users() edi)
    queryKey: queryKeys.owner.users.list({ page, limit, search, role, sortBy, sortOrder } as Record<string, unknown>),
    queryFn: async (): Promise<UsersQueryResult> => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search) params.set('search', search);
      if (role) params.set('role', role);
      if (sortBy) params.set('sortBy', sortBy);
      if (sortOrder) params.set('order', sortOrder);

      const res = await httpClient.get<unknown>(`/owner/users?${params.toString()}`);
      if (!res.data) throw new Error('Failed to fetch users');

      const data = res.data as {
        data?: BackendUserRow[];
        meta?: { total?: number; page?: number; limit?: number };
      };

      const rawList: BackendUserRow[] = Array.isArray(data.data)
        ? data.data
        : Array.isArray(res.data)
          ? (res.data as BackendUserRow[])
          : [];

      const mapped = rawList.map(mapBackendUserRowToUserDto);
      const total = data.meta?.total ?? mapped.length;
      const currentPage = data.meta?.page ?? page;
      const currentLimit = data.meta?.limit ?? limit;
      const totalPages = Math.max(1, Math.ceil(total / currentLimit));

      return {
        users: mapped,
        meta: {
          page: currentPage,
          limit: currentLimit,
          total,
          totalPages,
          hasNextPage: currentPage < totalPages,
          hasPrevPage: currentPage > 1,
        },
      };
    },
    placeholderData: keepPreviousData,
    ...QUERY_DEFAULTS,
  });

  // FIX 2: changeRole — useMutation + optimistic update + rollback
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: UserRole }) => {
      const res = await httpClient.post(`/owner/users/${userId}/role`, { role: newRole });
      if (!res) throw new Error(`Role assignment failed`);
      return { userId, newRole };
    },
    onMutate: async ({ userId, newRole }) => {
      // FIX XATO 7: queryKeys.owner.users.list() ishlatiladi
      const currentQueryKey = queryKeys.owner.users.list({
        page, limit, search, role, sortBy, sortOrder,
      } as Record<string, unknown>);
      await queryClient.cancelQueries({ queryKey: currentQueryKey });

      const previousData = queryClient.getQueryData<UsersQueryResult>(currentQueryKey);

      if (previousData) {
        queryClient.setQueryData(currentQueryKey, {
          ...previousData,
          users: previousData.users.map((u) =>
            u.id === userId ? { ...u, role: newRole } : u,
          ),
        });
      }
      return { previousData, currentQueryKey };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(context.currentQueryKey, context.previousData);
      }
      addToast({ type: 'error', title: 'Failed to assign role. Please try again.' });
    },
    onSuccess: () => {
      // FIX XATO 7: queryKeys.owner.users.all() — barcha users list cachelarini invalidate qiladi
      void queryClient.invalidateQueries({ queryKey: queryKeys.owner.users.all() });
      addToast({ type: 'success', title: 'Role assigned successfully.' });
    },
  });

  // FIX XATO 4: toggleStatus — PATCH /owner/users/:id/status backendda yo'q.
  // Buning o'rniga POST /owner/hr endpointi ishlatiladi:
  //   status 'active'   → operation: 'hire'
  //   status 'inactive' → operation: 'fire'
  // Bu endpoint owner.controller.ts da mavjud va owner.service.ts da ishlaydi.
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: 'active' | 'inactive' }) => {
      const operation = status === 'active' ? 'hire' : 'fire';
      const res = await httpClient.post('/owner/hr', { userId, operation });
      if (!res) throw new Error(`Status update failed`);
      return { userId, status };
    },
    onMutate: async ({ userId, status }) => {
      // FIX XATO 7: queryKeys.owner.users.list() ishlatiladi
      const currentQueryKey = queryKeys.owner.users.list({
        page, limit, search, role, sortBy, sortOrder,
      } as Record<string, unknown>);
      await queryClient.cancelQueries({ queryKey: currentQueryKey });
      const previousData = queryClient.getQueryData<UsersQueryResult>(currentQueryKey);

      if (previousData) {
        queryClient.setQueryData(currentQueryKey, {
          ...previousData,
          users: previousData.users.map((u) =>
            u.id === userId ? { ...u, status } : u,
          ),
        });
      }
      return { previousData, currentQueryKey };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(context.currentQueryKey, context.previousData);
      }
      addToast({ type: 'error', title: 'Failed to update status. Please try again.' });
    },
    onSuccess: () => {
      // FIX XATO 7: queryKeys.owner.users.all() ishlatiladi
      void queryClient.invalidateQueries({ queryKey: queryKeys.owner.users.all() });
    },
  });

  const changeRole = useCallback(
    async (userId: string, newRole: UserRole) => {
      await changeRoleMutation.mutateAsync({ userId, newRole });
    },
    [changeRoleMutation],
  );

  const toggleStatus = useCallback(
    async (userId: string, status: 'active' | 'inactive') => {
      await toggleStatusMutation.mutateAsync({ userId, status });
    },
    [toggleStatusMutation],
  );

  return {
    users:            query.data?.users ?? [],
    paginationMeta:   query.data?.meta ?? {
      page: 1, limit: 10, total: 0, totalPages: 1,
      hasNextPage: false, hasPrevPage: false,
    },
    isLoading:        query.isLoading,
    isError:          query.isError,
    changeRole,
    toggleStatus,
    isChangingRole:   changeRoleMutation.isPending,
    isTogglingStatus: toggleStatusMutation.isPending,
    // FIX XATO 7: queryKeys.owner.users.all() ishlatiladi
    refresh:          () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.owner.users.all() }),
  };
}

// ── Roles ─────────────────────────────────────────────────────────────────────
//
// FIX 1: useQuery bilan server ma'lumoti (avval useState + useEffect edi).
// FIX 2: saveRole useMutation + cache invalidation + addToast.
// FIX 3: createRole useMutation + POST /owner/roles (avval faqat modal yopilardi).

export function useOwnerRoles() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  const {
    data: matrix,
    isLoading,
    isError,
  } = useQuery<PermissionMatrix>({
    queryKey: queryKeys.owner.roles(),
    // OBS-13: ownerApi.getRoles() maps the raw /owner/roles response into a
    // PermissionMatrix and derives allPermissions when the backend doesn't
    // supply them. The previous inline queryFn returned allPermissions: []
    // for array responses, which made the matrix render empty.
    queryFn: () => ownerApi.getRoles(),
    ...QUERY_DEFAULTS,
  });

  // FIX 2: saveRole — useMutation + cache invalidation
  const saveRoleMutation = useMutation({
    mutationFn: async ({
      roleId,
      permissions,
    }: {
      roleId: string;
      permissions: string[];
    }) => {
      await httpClient.patch(`/owner/roles/${roleId}/permissions`, { permissions });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.owner.roles() });
      addToast({ type: 'success', title: 'Permissions saved successfully.' });
    },
    onError: () => {
      addToast({ type: 'error', title: 'Failed to save permissions. Please try again.' });
    },
  });

  // FIX 3: createRole — useMutation + POST /owner/roles
  const createRoleMutation = useMutation({
    mutationFn: async (name: string) => {
      await httpClient.post('/owner/roles', { name });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.owner.roles() });
      addToast({ type: 'success', title: 'Role created successfully.' });
    },
    onError: () => {
      addToast({ type: 'error', title: 'Failed to create role. Please try again.' });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      await ownerApi.deleteRole(roleId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.owner.roles() });
      addToast({ type: 'success', title: 'Role deleted successfully.' });
    },
    onError: (error: unknown) => {
      addToast({ type: 'error', title: parseApiError(error).message });
    },
  });

  const saveRole = useCallback(
    async (roleId: string, permissions: string[]) => {
      await saveRoleMutation.mutateAsync({ roleId, permissions });
    },
    [saveRoleMutation],
  );

  const createRole = useCallback(
    async (name: string) => {
      await createRoleMutation.mutateAsync(name);
    },
    [createRoleMutation],
  );

  const deleteRole = useCallback(
    async (roleId: string) => {
      await deleteRoleMutation.mutateAsync(roleId);
    },
    [deleteRoleMutation],
  );

  return {
    matrix:         matrix ?? null,
    isLoading,
    isError,
    saveRole,
    createRole,
    deleteRole,
    isCreatingRole: createRoleMutation.isPending,
    isSavingRole:   saveRoleMutation.isPending,
    isDeletingRole: deleteRoleMutation.isPending,
  };
}

// ── Finances ──────────────────────────────────────────────────────────────────

export function useOwnerFinances() {
  const query = useQuery({
    queryKey: queryKeys.owner.finances(),
    queryFn: async (): Promise<FinancialOverview> => {
      const res = await httpClient.get<FinancialOverview>('/owner/analytics/financial');
      return res.data;
    },
    ...QUERY_DEFAULTS,
  });

  // Export report: GET /owner/export/:type — backend tomonidan Excel formatida qaytariladi
  // Backend only supports Excel export via /owner/export/:type
  const exportReport = useCallback(async (format: 'pdf' | 'excel') => {
    // Backend faqat 'payments' tipini qabul qiladi (students | payments | attendance)
    const exportType = format === 'excel' ? 'payments' : 'payments';
    const res = await httpClient.get(`/owner/export/${exportType}`, { responseType: 'blob' });
    const blob = new Blob([res.data as BlobPart]);
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
    await httpClient.post('/owner/finances/send-reminders');
  }, []);

  return {
    overview:             query.data ?? null,
    isLoading:            query.isLoading,
    exportReport,
    sendOverdueReminders,
  };
}

// ── Analytics ─────────────────────────────────────────────────────────────────
//
// FIXED: useOwnerAnalytics TanStack Query v5 useQuery bilan.
// placeholderData: empty arrays — slice() hech qachon crash qilmaydi.

export function useOwnerAnalytics() {
  const query = useQuery({
    queryKey: queryKeys.owner.analytics(),
    queryFn: async (): Promise<MultiTenantChartData> => {
      const res = await httpClient.get<BackendGlobalAnalytics>('/owner/analytics/global');
      return mapBackendAnalyticsToChartData(res.data);
    },
    // placeholderData: empty arrays — slice() hech qachon crash qilmaydi
    placeholderData: (): MultiTenantChartData => ({
      globalRevenue:    [],
      userGrowth:       [],
      enrollmentTrends: [],
      branchComparison: [],
    }),
    ...QUERY_DEFAULTS,
  });

  return {
    chartData: query.data ?? null,
    isLoading: query.isLoading,
    isError:   query.isError,
  };
}

// ── HR ────────────────────────────────────────────────────────────────────────
//
// FIXED: useOwnerHR TanStack Query v5 useQuery bilan.
// Backend endpoint: GET /api/v1/owner/users
// Teachers + admins parallel yuklanadi, branches branchId ni aniqlash uchun.
//
// BUG FIX: users.branch — bu matn nom (masalan "Main Branch").
// HRPanel filtri branchId (UUID) bilan solishtiradi → nom !== UUID → hech kim chiqmaydi.
// Yechim: branches ro'yxatini yuklab, nom orqali to'g'ri UUID topamiz.

export function useOwnerHR() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.owner.hr(),
    queryFn: async (): Promise<StaffDto[]> => {
      const [teacherRes, adminRes, branchRes] = await Promise.all([
        httpClient.get<unknown>('/owner/users?role=teacher&limit=100'),
        httpClient.get<unknown>('/owner/users?role=admin&limit=100'),
        httpClient.get<unknown>('/owner/branches'),
      ]);

      // PaginatedResult<UserRow> yoki to'g'ridan-to'g'ri array — ikkalasini ham handle qilamiz
      const extractRows = (d: unknown): BackendUserRow[] =>
        Array.isArray((d as { data?: unknown }).data)
          ? ((d as { data: BackendUserRow[] }).data)
          : Array.isArray(d) ? (d as BackendUserRow[]) : [];

      const branches: BackendBranchRow[] = Array.isArray(branchRes.data)
        ? (branchRes.data as BackendBranchRow[])
        : [];

      const allRows = [
        ...extractRows(teacherRes.data),
        ...extractRows(adminRes.data),
      ];

      return allRows
        .map((u) => mapBackendUserToStaffDto(u, branches))
        .filter((s): s is StaffDto => s !== null);
    },
    ...QUERY_DEFAULTS,
  });

  const updateSalaryMutation = useMutation({
    mutationFn: async ({ staffId, salary }: { staffId: string; salary: number }) => {
      // Backend POST /owner/hr — 'update_salary' operatsiyasi
      // Maosh metadata JSONB da saqlanadi (users jadvalida alohida salary column yo'q)
      await httpClient.post('/owner/hr', {
        userId: staffId,
        operation: 'update_salary',
        salary,
      });
      return { staffId, salary };
    },
    onSuccess: ({ staffId, salary }) => {
      // Local cache yangilaymiz — sahifani qayta yuklamasdan ko'rinadi
      queryClient.setQueryData(
        queryKeys.owner.hr(),
        (old: StaffDto[] | undefined) =>
          old ? old.map((s) => (s.id === staffId ? { ...s, salary } : s)) : old,
      );
    },
  });

  return {
    staff:        query.data ?? [],
    isLoading:    query.isLoading,
    updateSalary: (staffId: string, salary: number) =>
      updateSalaryMutation.mutateAsync({ staffId, salary }),
  };
}

