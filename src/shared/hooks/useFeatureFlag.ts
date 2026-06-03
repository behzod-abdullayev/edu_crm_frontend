'use client';

import { useTenantStore } from '@/store/tenant.store';
import type { FeatureFlags } from '@/store/tenant.store';

// Map simple string keys to FeatureFlags property names
const FLAG_MAP: Record<string, keyof FeatureFlags> = {
  payments: 'paymentsEnabled',
  chat: 'chatEnabled',
  certificates: 'certificatesEnabled',
  examEngine: 'examEngineEnabled',
  analytics: 'analyticsEnabled',
  hr: 'hrEnabled',
};

/**
 * Returns whether a feature flag is enabled for the current tenant.
 * Accepts short flag names like 'chat', 'examEngine', 'payments'.
 */
export function useFeatureFlag(flag: string): boolean {
  const featureFlags = useTenantStore((s) => s.featureFlags);
  const key = FLAG_MAP[flag];
  if (!key) return false;
  return featureFlags[key];
}
