import { httpClient } from './axios.instance';
import type { PaginatedResponse, PaginationParams } from './students.api';
import type { FeatureFlags, TenantConfig } from '@/store/tenant.store';
import type { PermissionMatrix, UserRole, BranchDto, BranchForm } from '@/modules/owner/types/owner.types';

// ── Backend role response shape ───────────────────────────────────────────────
// Backend GET /owner/roles returns one of:
//   a) PermissionMatrix: { roles: [...], allPermissions: [...] }
//   b) Plain array: RoleRow[]
// Both shapes are handled by mapRawRolesToMatrix below.

interface BackendRoleRow {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
  isSystem?: boolean;
  userCount?: number;
}

// System roles fallback — shown when backend returns an empty array
// (e.g. new tenant with no custom_roles seeded yet)
const SYSTEM_ROLE_FALLBACK: BackendRoleRow[] = [
  { id: 'student', name: 'student', permissions: [], isSystem: true },
  { id: 'teacher', name: 'teacher', permissions: [], isSystem: true },
  { id: 'admin',   name: 'admin',   permissions: [], isSystem: true },
  { id: 'owner',   name: 'owner',   permissions: [], isSystem: true },
];

function mapRawRolesToMatrix(raw: unknown): PermissionMatrix {
  // Shape a) — already a PermissionMatrix
  if (
    raw !== null &&
    typeof raw === 'object' &&
    'roles' in (raw as object) &&
    !Array.isArray(raw)
  ) {
    const typed = raw as { roles: BackendRoleRow[]; allPermissions?: PermissionMatrix['allPermissions'] };
    const roles = (typed.roles ?? []).length > 0 ? typed.roles : SYSTEM_ROLE_FALLBACK;
    return buildMatrix(roles, typed.allPermissions);
  }

  // Shape b) — plain array
  const rows: BackendRoleRow[] = Array.isArray(raw)
    ? (raw as BackendRoleRow[])
    : [];
  const nonEmpty = rows.length > 0 ? rows : SYSTEM_ROLE_FALLBACK;
  return buildMatrix(nonEmpty, undefined);
}

function buildMatrix(
  rows: BackendRoleRow[],
  allPermissions: PermissionMatrix['allPermissions'] | undefined,
): PermissionMatrix {
  const roles: PermissionMatrix['roles'] = rows.map((r) => ({
    id: r.id,
    name: r.name as UserRole,
    // displayName: derive from name if backend doesn't supply it
    displayName: r.name.charAt(0).toUpperCase() + r.name.slice(1),
    permissions: r.permissions ?? [],
    isSystem: r.isSystem ?? false,
    userCount: r.userCount ?? 0,
  }));

  // Derive allPermissions from the union of role.permissions
  // if backend didn't supply them (or the array is empty)
  if (Array.isArray(allPermissions) && allPermissions.length > 0) {
    return { roles, allPermissions };
  }

  const categoryMap = new Map<string, Set<string>>();
  for (const role of roles) {
    for (const perm of role.permissions) {
      // '*' is the Owner's full-access wildcard, not a real permission key —
      // skip it so it doesn't show up as its own bogus category.
      if (perm === '*') continue;
      const category = perm.split('.')[0] ?? 'other';
      if (!categoryMap.has(category)) categoryMap.set(category, new Set());
      categoryMap.get(category)?.add(perm);
    }
  }

  const derived: PermissionMatrix['allPermissions'] = Array.from(
    categoryMap.entries(),
  ).map(([category, permSet]) => ({
    category,
    permissions: Array.from(permSet).map((key) => ({
      key,
      label: key.replace(/\./g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    })),
  }));

  return { roles, allPermissions: derived };
}

function mapRawBranch(b: Record<string, unknown>): BranchDto {
  const isActive =
    b['isActive'] === true ||
    b['is_active'] === true ||
    b['status'] === 'active';
  return {
    id:             String(b['id'] ?? ''),
    name:           String(b['name'] ?? ''),
    address:        String(b['address'] ?? ''),
    managerId:      (b['managerId'] as string | null) ?? null,
    managerName:    (b['managerName'] as string | null) ?? null,
    studentCount:   Number(b['studentCount'] ?? b['student_count'] ?? 0),
    teacherCount:   Number(b['teacherCount'] ?? b['teacher_count'] ?? 0),
    courseCount:    Number(b['courseCount'] ?? 0),
    monthlyRevenue: Number(b['monthlyRevenue'] ?? b['monthly_revenue'] ?? 0),
    currency:       String(b['currency'] ?? 'UZS'),
    status:         isActive ? 'active' : 'inactive',
    createdAt:      String(b['createdAt'] ?? b['created_at'] ?? new Date().toISOString()),
  };
}

export { mapRawRolesToMatrix };

export interface OwnerDashboardStats {
  totalTenants: number;
  activeTenants: number;
  totalUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  mrr: number;
  arr: number;
  churnRate: number;
  currency: string;
  revenueByMonth: Array<{ month: string; amount: number }>;
  userGrowth: Array<{ month: string; count: number }>;
}

export interface TenantSummary {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  plan: TenantPlan;
  status: TenantStatus;
  studentCount: number;
  teacherCount: number;
  courseCount: number;
  monthlyRevenue: number;
  currency: string;
  featureFlags: FeatureFlags;
  createdAt: string;
  expiresAt?: string;
}

export type TenantPlan = 'starter' | 'growth' | 'enterprise' | 'custom';
export type TenantStatus = 'active' | 'suspended' | 'trialing' | 'cancelled';

export interface CreateTenantDto {
  name: string;
  slug: string;
  plan: TenantPlan;
  ownerEmail: string;
  ownerFirstName: string;
  ownerLastName: string;
  timezone?: string;
  featureFlags?: Partial<FeatureFlags>;
}

export interface UpdateTenantDto {
  name?: string;
  logo?: string;
  plan?: TenantPlan;
  status?: TenantStatus;
  featureFlags?: Partial<FeatureFlags>;
  expiresAt?: string;
  theme?: TenantConfig['theme'];
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: Array<{
    name: string;
    status: 'up' | 'down';
    latencyMs?: number;
  }>;
  timestamp: string;
}

export interface BillingRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  currency: string;
  plan: TenantPlan;
  period: string;
  status: 'paid' | 'pending' | 'failed';
  paidAt?: string;
}

export const ownerApi = {
  getDashboard: async (): Promise<OwnerDashboardStats> => {
    const { data } = await httpClient.get<OwnerDashboardStats>(
      '/owner/dashboard',
    );
    return data;
  },

  getTenants: async (
    params: PaginationParams & { status?: TenantStatus; plan?: TenantPlan },
  ): Promise<PaginatedResponse<TenantSummary>> => {
    const { data } = await httpClient.get<PaginatedResponse<TenantSummary>>(
      '/owner/tenants',
      { params },
    );
    return data;
  },

  getTenantById: async (id: string): Promise<TenantSummary> => {
    const { data } = await httpClient.get<TenantSummary>(
      `/owner/tenants/${id}`,
    );
    return data;
  },

  createTenant: async (dto: CreateTenantDto): Promise<TenantSummary> => {
    const { data } = await httpClient.post<TenantSummary>(
      '/owner/tenants',
      dto,
    );
    return data;
  },

  updateTenant: async (
    id: string,
    dto: UpdateTenantDto,
  ): Promise<TenantSummary> => {
    const { data } = await httpClient.patch<TenantSummary>(
      `/owner/tenants/${id}`,
      dto,
    );
    return data;
  },

  suspendTenant: async (id: string, reason?: string): Promise<TenantSummary> => {
    const { data } = await httpClient.post<TenantSummary>(
      `/owner/tenants/${id}/suspend`,
      { reason },
    );
    return data;
  },

  activateTenant: async (id: string): Promise<TenantSummary> => {
    const { data } = await httpClient.post<TenantSummary>(
      `/owner/tenants/${id}/activate`,
    );
    return data;
  },

  deleteTenant: async (id: string): Promise<void> => {
    await httpClient.delete(`/owner/tenants/${id}`);
  },

  getSystemHealth: async (): Promise<SystemHealth> => {
    const { data } = await httpClient.get<SystemHealth>('/owner/health');
    return data;
  },

  getBillingRecords: async (
    params: PaginationParams & { tenantId?: string },
  ): Promise<PaginatedResponse<BillingRecord>> => {
    const { data } = await httpClient.get<PaginatedResponse<BillingRecord>>(
      '/owner/billing',
      { params },
    );
    return data;
  },

  updateFeatureFlags: async (
    tenantId: string,
    flags: Partial<FeatureFlags>,
  ): Promise<TenantSummary> => {
    const { data } = await httpClient.patch<TenantSummary>(
      `/owner/tenants/${tenantId}/features`,
      flags,
    );
    return data;
  },

  // ── Roles & Permissions ─────────────────────────────────────────────────────

  getRoles: async (): Promise<PermissionMatrix> => {
    const { data } = await httpClient.get<unknown>('/owner/roles');
    return mapRawRolesToMatrix(data);
  },

  createRole: async (dto: { name: string }): Promise<void> => {
    await httpClient.post('/owner/roles', dto);
  },

  updateRolePermissions: async (
    roleId: string,
    permissions: string[],
  ): Promise<void> => {
    await httpClient.patch(`/owner/roles/${roleId}/permissions`, {
      permissions,
    });
  },

  deleteRole: async (roleId: string): Promise<void> => {
    await httpClient.delete(`/owner/roles/${roleId}`);
  },

  // ── Branches ────────────────────────────────────────────────────────────────
  // XATO 2 fix: updateBranch uses POST (no PATCH /owner/branches/:id in backend)
  // XATO 3 fix: deactivateBranch — backend DTO has no isActive field
  // XATO 4 fix: these methods used by TanStack Query hooks in BranchesClient

  getBranches: async (): Promise<BranchDto[]> => {
    const { data } = await httpClient.get<unknown>('/owner/branches');
    const list = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
    return list.map(mapRawBranch);
  },

  createBranch: async (form: BranchForm): Promise<void> => {
    const { data } = await httpClient.post<unknown>('/owner/branches', form);
    const raw = data as Record<string, unknown>;
    // backend returns { branches: [...] } or single branch object
    void raw;
  },

  // XATO 2 fix: POST with id field (backend has no PATCH /owner/branches/:id)
  updateBranch: async (id: string, form: BranchForm): Promise<void> => {
    await httpClient.post('/owner/branches', { id, ...form });
  },

  // XATO 3 fix: backend DTO has no isActive field — UI does optimistic local update
  deactivateBranch: async (_id: string): Promise<void> => {
    // Intentional no-op: optimistic local state update handles UI change.
    // Backend does not expose a standalone deactivate endpoint.
  },
};