import { httpClient } from './axios.instance';
import type { PaginatedResponse, PaginationParams } from './students.api';
import type { FeatureFlags, TenantConfig } from '@/store/tenant.store';

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
};
