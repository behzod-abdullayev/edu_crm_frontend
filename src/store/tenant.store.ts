import { create } from 'zustand';
import { httpClient } from '@/services/api/axios.instance';

export interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  logo?: string;
  theme?: {
    primaryColor?: string;
    darkMode?: boolean;
  };
  timezone: string;
}

export interface FeatureFlags {
  paymentsEnabled: boolean;
  chatEnabled: boolean;
  certificatesEnabled: boolean;
  examEngineEnabled: boolean;
  analyticsEnabled: boolean;
  hrEnabled: boolean;
}

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  paymentsEnabled: true,
  chatEnabled: false,
  certificatesEnabled: false,
  examEngineEnabled: false,
  analyticsEnabled: true,
  hrEnabled: false,
};

interface TenantState {
  tenantId: string | null;
  tenantSlug: string | null;
  config: TenantConfig | null;
  featureFlags: FeatureFlags;
  isLoaded: boolean;
}

interface TenantActions {
  loadTenant: (
    slugOrData:
      | string
      | { config: TenantConfig; featureFlags?: Partial<FeatureFlags> },
  ) => Promise<void>;
  setFeatureFlag: (key: keyof FeatureFlags, value: boolean) => void;
  reset: () => void;
}

type TenantStore = TenantState & TenantActions & { isLoading?: boolean };

const initialState: TenantState = {
  tenantId: null,
  tenantSlug: null,
  config: null,
  featureFlags: DEFAULT_FEATURE_FLAGS,
  isLoaded: false,
};

type TenantApiResponse = TenantConfig & { featureFlags?: Partial<FeatureFlags> };

export const useTenantStore = create<TenantStore>()((set) => ({
  ...initialState,

  loadTenant: async (slugOrData) => {
    if (typeof slugOrData === 'object') {
      const { config, featureFlags: flags } = slugOrData;
      set({
        tenantId: config.id,
        tenantSlug: config.slug ?? config.id,
        config,
        featureFlags: { ...DEFAULT_FEATURE_FLAGS, ...(flags ?? {}) },
        isLoaded: true,
      });
      return;
    }

    const slug = slugOrData;
    try {
      const response = await httpClient.get<TenantApiResponse>(
        `/tenants/config?slug=${slug}`,
      );
      const data = response.data;

      const config: TenantConfig = {
        id: data.id,
        slug: data.slug,
        name: data.name,
        timezone: data.timezone,
        ...(data.logo !== undefined ? { logo: data.logo } : {}),
        ...(data.theme !== undefined ? { theme: data.theme } : {}),
      };

      set({
        tenantId: data.id,
        tenantSlug: data.slug,
        config,
        featureFlags: {
          ...DEFAULT_FEATURE_FLAGS,
          ...(data.featureFlags ?? {}),
        },
        isLoaded: true,
      });
    } catch {
      set({ isLoaded: true });
    }
  },

  setFeatureFlag: (key: keyof FeatureFlags, value: boolean) => {
    set((state) => ({
      featureFlags: { ...state.featureFlags, [key]: value },
    }));
  },

  reset: () => {
    set({ ...initialState });
  },
}));