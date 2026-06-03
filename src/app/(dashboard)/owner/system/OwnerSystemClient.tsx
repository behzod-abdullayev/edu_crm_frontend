'use client';

import { useOwnerSystem } from '@/modules/owner/hooks/useOwner';
import { SystemConfigPanel } from '@/modules/owner/components/SystemConfigPanel';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { can } from '@/lib/permissions';

export function OwnerSystemClient() {
  const { user } = useAuth();
  const {
    config,
    health,
    apiVersion,
    isLoading,
    saveConfig,
    clearCache,
    triggerBackup,
  } = useOwnerSystem();

  if (!can(user, 'system.manage')) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <p className="text-muted-foreground">
          You do not have permission to access system settings.
        </p>
      </div>
    );
  }

  if (isLoading || !config || !health) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">System</h1>
        <p className="text-sm text-muted-foreground">
          Platform configuration, health, and maintenance
        </p>
      </div>

      <SystemConfigPanel
        config={config}
        health={health}
        apiVersion={apiVersion}
        onSaveConfig={saveConfig}
        onClearCache={clearCache}
        onTriggerBackup={triggerBackup}
      />
    </div>
  );
}
