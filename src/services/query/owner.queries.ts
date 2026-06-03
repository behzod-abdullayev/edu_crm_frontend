'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { queryKeys } from './keys.factory';
import {
  ownerApi,
  type CreateTenantDto,
  type UpdateTenantDto,
  type TenantStatus,
  type TenantPlan,
} from '@/services/api/owner.api';
import type { FeatureFlags } from '@/store/tenant.store';
import { useUIStore } from '@/store/ui.store';
import { parseApiError } from '@/shared/utils/api-error';
import type { PaginationParams } from './keys.factory';

const QUERY_DEFAULTS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  retry: 2,
  retryDelay: (n: number) => Math.min(1000 * 2 ** n, 30_000),
  refetchOnWindowFocus: false,
  refetchOnMount: true,
} as const;

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function useOwnerDashboard() {
  return useQuery({
    queryKey: queryKeys.owner.dashboard(),
    queryFn: () => ownerApi.getDashboard(),
    ...QUERY_DEFAULTS,
  });
}

// ── Tenants ───────────────────────────────────────────────────────────────────

export function useOwnerTenantList(
  params: PaginationParams & { status?: TenantStatus; plan?: TenantPlan },
) {
  return useQuery({
    queryKey: queryKeys.owner.tenants.list(params),
    queryFn: () => ownerApi.getTenants(params),
    ...QUERY_DEFAULTS,
  });
}

export function useOwnerTenantDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.owner.tenants.detail(id),
    queryFn: () => ownerApi.getTenantById(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (dto: CreateTenantDto) => ownerApi.createTenant(dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.owner.tenants.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.owner.dashboard(),
      });
      addToast({ type: 'success', title: 'Tenant created successfully.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

export function useUpdateTenant(id: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (dto: UpdateTenantDto) => ownerApi.updateTenant(id, dto),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.owner.tenants.detail(id), updated);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.owner.tenants.lists(),
      });
      addToast({ type: 'success', title: 'Tenant updated.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

export function useSuspendTenant() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      ownerApi.suspendTenant(id, reason),
    onSuccess: (updated, { id }) => {
      queryClient.setQueryData(queryKeys.owner.tenants.detail(id), updated);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.owner.tenants.lists(),
      });
      addToast({ type: 'warning', title: 'Tenant suspended.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

export function useActivateTenant() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: string) => ownerApi.activateTenant(id),
    onSuccess: (updated, id) => {
      queryClient.setQueryData(queryKeys.owner.tenants.detail(id), updated);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.owner.tenants.lists(),
      });
      addToast({ type: 'success', title: 'Tenant activated.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (id: string) => ownerApi.deleteTenant(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.owner.tenants.detail(id) });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.owner.tenants.lists(),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.owner.dashboard(),
      });
      addToast({ type: 'success', title: 'Tenant deleted.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

export function useUpdateFeatureFlags(tenantId: string) {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: (flags: Partial<FeatureFlags>) =>
      ownerApi.updateFeatureFlags(tenantId, flags),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        queryKeys.owner.tenants.detail(tenantId),
        updated,
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.owner.tenants.lists(),
      });
      addToast({ type: 'success', title: 'Feature flags updated.' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },
  });
}

// ── Billing ───────────────────────────────────────────────────────────────────

export function useOwnerBilling(
  params: PaginationParams & { tenantId?: string },
) {
  return useQuery({
    queryKey: queryKeys.owner.billing(params),
    queryFn: () => ownerApi.getBillingRecords(params),
    ...QUERY_DEFAULTS,
  });
}

// ── System Health ─────────────────────────────────────────────────────────────

export function useSystemHealth() {
  return useQuery({
    queryKey: queryKeys.owner.health(),
    queryFn: () => ownerApi.getSystemHealth(),
    staleTime: 30 * 1000,        // 30s — health changes quickly
    gcTime: 60 * 1000,
    retry: 1,
    retryDelay: 2000,
    refetchOnWindowFocus: true,  // always refresh health on focus
    refetchOnMount: true,
    refetchInterval: 60 * 1000, // auto-poll every 60s
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function useOwnerAnalytics(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: queryKeys.owner.analytics(params),
    queryFn: () =>
      // owner.api does not expose getAnalytics yet — route to dashboard for now
      // Replace with ownerApi.getAnalytics(params) once endpoint is added
      ownerApi.getDashboard(),
    ...QUERY_DEFAULTS,
  });
}
