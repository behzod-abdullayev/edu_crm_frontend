import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useTenantStore } from '@/store/tenant.store';
import type { TenantConfig, FeatureFlags } from '@/store/tenant.store';

vi.mock('@/services/api/axios.instance', () => ({
  httpClient: {
    get: vi.fn(),
  },
}));

// TenantConfig da "slug" majburiy — store.ts ga mos
const mockTenantConfig: TenantConfig = {
  id: 'tenant-1',
  slug: 'bright',
  name: 'Bright Academy',
  timezone: 'Asia/Tashkent',
  logo: 'https://cdn.example.com/logo.png',
  theme: {
    primaryColor: '#4F46E5',
    darkMode: false,
  },
};

// FeatureFlags store.ts dagi haqiqiy fieldlar bilan
const mockFeatureFlags: Partial<FeatureFlags> = {
  paymentsEnabled: true,
  chatEnabled: false,
  certificatesEnabled: false,
  examEngineEnabled: false,
  analyticsEnabled: true,
  hrEnabled: false,
};

describe('useTenantStore', () => {
  beforeEach(() => {
    act(() => {
      useTenantStore.getState().reset();
    });
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('config is null on init', () => {
      expect(useTenantStore.getState().config).toBeNull();
    });

    it('isLoaded is false on init', () => {
      expect(useTenantStore.getState().isLoaded).toBe(false);
    });

    it('tenantId is null on init', () => {
      expect(useTenantStore.getState().tenantId).toBeNull();
    });

    it('tenantSlug is null on init', () => {
      expect(useTenantStore.getState().tenantSlug).toBeNull();
    });
  });

  describe('loadTenant()', () => {
    it('sets config correctly when called with object', async () => {
      await act(async () => {
        await useTenantStore.getState().loadTenant({
          config: mockTenantConfig,
          featureFlags: mockFeatureFlags,
        });
      });
      expect(useTenantStore.getState().config).toEqual(mockTenantConfig);
    });

    it('sets tenantId from config.id', async () => {
      await act(async () => {
        await useTenantStore.getState().loadTenant({
          config: mockTenantConfig,
          featureFlags: mockFeatureFlags,
        });
      });
      expect(useTenantStore.getState().tenantId).toBe('tenant-1');
    });

    it('sets tenantSlug from config.slug', async () => {
      await act(async () => {
        await useTenantStore.getState().loadTenant({
          config: mockTenantConfig,
          featureFlags: mockFeatureFlags,
        });
      });
      expect(useTenantStore.getState().tenantSlug).toBe('bright');
    });

    it('sets featureFlags correctly — paymentsEnabled true', async () => {
      await act(async () => {
        await useTenantStore.getState().loadTenant({
          config: mockTenantConfig,
          featureFlags: { paymentsEnabled: true },
        });
      });
      expect(useTenantStore.getState().featureFlags.paymentsEnabled).toBe(true);
    });

    it('sets featureFlags correctly — chatEnabled false', async () => {
      await act(async () => {
        await useTenantStore.getState().loadTenant({
          config: mockTenantConfig,
          featureFlags: { chatEnabled: false },
        });
      });
      expect(useTenantStore.getState().featureFlags.chatEnabled).toBe(false);
    });

    it('sets isLoaded to true after loading', async () => {
      await act(async () => {
        await useTenantStore.getState().loadTenant({
          config: mockTenantConfig,
          featureFlags: mockFeatureFlags,
        });
      });
      expect(useTenantStore.getState().isLoaded).toBe(true);
    });

    it('merges featureFlags with defaults — unspecified flags keep default values', async () => {
      await act(async () => {
        await useTenantStore.getState().loadTenant({
          config: mockTenantConfig,
          featureFlags: { paymentsEnabled: true },
        });
      });
      const flags = useTenantStore.getState().featureFlags;
      // paymentsEnabled must be overridden to true
      expect(flags.paymentsEnabled).toBe(true);
      // analyticsEnabled keeps its default (true per DEFAULT_FEATURE_FLAGS)
      expect(typeof flags.analyticsEnabled).toBe('boolean');
    });
  });

  describe('reset()', () => {
    it('clears config to null', async () => {
      await act(async () => {
        await useTenantStore.getState().loadTenant({
          config: mockTenantConfig,
          featureFlags: mockFeatureFlags,
        });
        useTenantStore.getState().reset();
      });
      expect(useTenantStore.getState().config).toBeNull();
    });

    it('resets tenantId to null', async () => {
      await act(async () => {
        await useTenantStore.getState().loadTenant({
          config: mockTenantConfig,
          featureFlags: mockFeatureFlags,
        });
        useTenantStore.getState().reset();
      });
      expect(useTenantStore.getState().tenantId).toBeNull();
    });

    it('resets isLoaded to false', async () => {
      await act(async () => {
        await useTenantStore.getState().loadTenant({
          config: mockTenantConfig,
          featureFlags: mockFeatureFlags,
        });
        useTenantStore.getState().reset();
      });
      expect(useTenantStore.getState().isLoaded).toBe(false);
    });

    it('resets featureFlags to defaults', async () => {
      await act(async () => {
        await useTenantStore.getState().loadTenant({
          config: mockTenantConfig,
          featureFlags: { paymentsEnabled: true, chatEnabled: true },
        });
        useTenantStore.getState().reset();
      });
      const flags = useTenantStore.getState().featureFlags;
      // After reset, flags should be DEFAULT_FEATURE_FLAGS values
      expect(typeof flags.paymentsEnabled).toBe('boolean');
      expect(typeof flags.chatEnabled).toBe('boolean');
    });
  });

  describe('setFeatureFlag()', () => {
    it('updates paymentsEnabled without affecting other flags', () => {
      act(() => {
        useTenantStore.getState().setFeatureFlag('paymentsEnabled', true);
      });
      expect(useTenantStore.getState().featureFlags.paymentsEnabled).toBe(true);
      // Other flags remain unchanged
      const flags = useTenantStore.getState().featureFlags;
      expect(typeof flags.chatEnabled).toBe('boolean');
    });

    it('updates chatEnabled to true', () => {
      act(() => {
        useTenantStore.getState().setFeatureFlag('chatEnabled', true);
      });
      expect(useTenantStore.getState().featureFlags.chatEnabled).toBe(true);
    });

    it('updates analyticsEnabled to false', () => {
      act(() => {
        useTenantStore.getState().setFeatureFlag('analyticsEnabled', false);
      });
      expect(useTenantStore.getState().featureFlags.analyticsEnabled).toBe(false);
    });

    it('updates certificatesEnabled to true', () => {
      act(() => {
        useTenantStore.getState().setFeatureFlag('certificatesEnabled', true);
      });
      expect(useTenantStore.getState().featureFlags.certificatesEnabled).toBe(true);
    });

    it('updates examEngineEnabled to true', () => {
      act(() => {
        useTenantStore.getState().setFeatureFlag('examEngineEnabled', true);
      });
      expect(useTenantStore.getState().featureFlags.examEngineEnabled).toBe(true);
    });

    it('updates hrEnabled to true', () => {
      act(() => {
        useTenantStore.getState().setFeatureFlag('hrEnabled', true);
      });
      expect(useTenantStore.getState().featureFlags.hrEnabled).toBe(true);
    });
  });
});