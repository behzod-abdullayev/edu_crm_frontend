'use client';

import { useOwnerRoles } from '@/modules/owner/hooks/useOwner';
import { RolePermissionMatrix } from '@/modules/owner/components/RolePermissionMatrix';

export function OwnerRolesClient() {
  const { matrix, isLoading, saveRole } = useOwnerRoles();

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Roles & Permissions</h1>
        <p className="text-sm text-muted-foreground">
          Define what each role can do across the platform
        </p>
      </div>

      {isLoading || !matrix ? (
        <div className="space-y-3">
          <div className="h-12 animate-pulse rounded-lg bg-muted" />
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      ) : (
        <RolePermissionMatrix
          matrix={matrix}
          onSaveRole={saveRole}
          onCreateRole={() => {
            // Opens custom role creation — wired to API in full impl
          }}
        />
      )}
    </div>
  );
}
