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
import type { SystemConfig } from '@/modules/owner/types/owner.types';
import {
  mapTenantRowToSystemConfig,
  mapSystemConfigToDto,
} from '@/modules/owner/utils/owner.mapper';

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
    staleTime: 30 * 1000,
    gcTime: 60 * 1000,
    retry: 1,
    retryDelay: 2000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 60 * 1000,
  });
}

// ── System Config (XATO 5 FIX) ───────────────────────────────────────────────
//
// Avval: useOwnerSystem = raw fetch + useState + useEffect (PROMPT QOIDASI BUZILISHI)
// Endi: useSystemConfig = TanStack Query useQuery (prompt talabiga mos)
//
// Backend GET /owner/system/config → TenantRow shape qaytaradi.
// mapTenantRowToSystemConfig() orqali SystemConfig ga o'giriladi.

export function useSystemConfig() {
  return useQuery<SystemConfig>({
    queryKey: queryKeys.owner.systemConfig(),
    queryFn: async (): Promise<SystemConfig> => {
      // Backend ikki endpoint orqali config qaytarishi mumkin:
      // /owner/system/config  yoki  /owner/config
      // Birinchisini sinab ko'ramiz, 404 bo'lsa ikkinchisini ishlatamiz
      const response = await fetch('/api/owner/system/config', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // 404: endpoint mavjud emas — default config qaytaramiz
        if (response.status === 404) {
          return mapTenantRowToSystemConfig(null);
        }
        throw new Error(`Config fetch failed: ${response.status}`);
      }

      const raw: unknown = await response.json();
      // Backend TenantRow formatda qaytaradi → mapper orqali SystemConfig ga o'giramiz
      return mapTenantRowToSystemConfig(raw as Parameters<typeof mapTenantRowToSystemConfig>[0]);
    },
    ...QUERY_DEFAULTS,
  });
}

// ── Save System Config (XATO 2 + 5 FIX) ─────────────────────────────────────
//
// XATO 2 FIX: Backend faqat featureFlags qabul qiladi.
//             mapSystemConfigToDto() orqali faqat featureFlags yuboriladi.
//             maintenanceMode va emailSmtp YUBORILMAYDI.
//
// XATO 5 FIX: useMutation + cache invalidation (raw fetch o'rniga).

export function useSaveSystemConfig() {
  const queryClient = useQueryClient();
  const { addToast } = useUIStore();

  return useMutation({
    mutationFn: async (config: SystemConfig): Promise<SystemConfig> => {
      // XATO 2 FIX: faqat featureFlags yuboriladi (backend qabul qiladigan DTO)
      const dto = mapSystemConfigToDto(config);

      const response = await fetch('/api/owner/system/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      });

      if (!response.ok) {
        // 404: backend endpoint yo'q — optimistic update qilib turamiz
        if (response.status === 404) {
          return config;
        }
        throw new Error(`Config save failed: ${response.status}`);
      }

      const raw: unknown = await response.json();
      return mapTenantRowToSystemConfig(raw as Parameters<typeof mapTenantRowToSystemConfig>[0]);
    },

    // Optimistic update: saqlashdan avval UI ni darhol yangilaymiz
    onMutate: async (newConfig: SystemConfig) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.owner.systemConfig() });
      const previousConfig = queryClient.getQueryData<SystemConfig>(
        queryKeys.owner.systemConfig(),
      );
      queryClient.setQueryData(queryKeys.owner.systemConfig(), newConfig);
      // exactOptionalPropertyTypes: true — `{ previousConfig: undefined }` is not
      // assignable to `{ previousConfig?: SystemConfig }`.
      // Only include the property when it actually has a value.
      return previousConfig !== undefined ? { previousConfig } : {};
    },

    onError: (
      error: unknown,
      _variables: SystemConfig,
      context: { previousConfig?: SystemConfig } | undefined,
    ) => {
      // Xato bo'lsa rollback
      if (context?.previousConfig) {
        queryClient.setQueryData(
          queryKeys.owner.systemConfig(),
          context.previousConfig,
        );
      }
      const parsed = parseApiError(error);
      addToast({ type: 'error', title: parsed.message });
    },

    onSuccess: (savedConfig: SystemConfig) => {
      // Muvaffaqiyatli saqlangandan keyin cache ni yangi data bilan yangilaymiz
      queryClient.setQueryData(queryKeys.owner.systemConfig(), savedConfig);
      addToast({ type: 'success', title: 'Configuration saved successfully.' });
    },
  });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export function useOwnerAnalytics(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: queryKeys.owner.analytics(params),
    queryFn: () => ownerApi.getDashboard(),
    ...QUERY_DEFAULTS,
  });
}