'use client';

import { useState } from 'react';
import { useAdminSettings } from '@/modules/admin/hooks/useAdmin';
import { TenantConfigForm } from '@/modules/admin/components/TenantConfigForm';
import { PricingManager } from '@/modules/admin/components/PricingManager';
import { SubscriptionManager } from '@/modules/payments/components/SubscriptionManager';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { can } from '@/lib/permissions';

const TABS = ['General', 'Pricing', 'Subscriptions'] as const;
type Tab = (typeof TABS)[number];

export function AdminSettingsClient() {
  const { user } = useAuth();
  const { config, pricing, isLoading, saveConfig, updatePrice, deletePrice } = useAdminSettings();
  const [activeTab, setActiveTab] = useState<Tab>('General');

  if (!can(user, 'system.config')) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to access settings.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-96 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your academy</p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'General' && config && (
        <TenantConfigForm initialConfig={config} onSave={saveConfig} />
      )}

      {activeTab === 'Pricing' && (
        <PricingManager
          entries={pricing}
          currencies={['UZS', 'USD', 'EUR', 'RUB']}
          onUpdatePrice={updatePrice}
          onDeleteEntry={deletePrice}
        />
      )}

      {activeTab === 'Subscriptions' && (
        <SubscriptionManager
          plans={[]}
          subscriptions={[]}
          onCreatePlan={async () => {}}
          onTogglePlan={async () => {}}
          onCancelSubscription={async () => {}}
        />
      )}
    </div>
  );
}
