'use client';

import { useState } from 'react';
import { PermissionMatrix, UserRole } from '../types/owner.types';

const CATEGORY_COLORS: Record<string, string> = {
  course: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  student: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  teacher: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  payment: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  schedule: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  system: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

interface RolePermissionMatrixProps {
  matrix: PermissionMatrix;
  onSaveRole: (roleId: string, permissions: string[]) => Promise<void>;
  onCreateRole: () => void;
}

export function RolePermissionMatrix({
  matrix,
  onSaveRole,
  onCreateRole,
}: RolePermissionMatrixProps) {
  const [permissions, setPermissions] = useState<Record<string, Set<string>>>(() => {
    const map: Record<string, Set<string>> = {};
    matrix.roles.forEach((role) => {
      map[role.id] = new Set(role.permissions);
    });
    return map;
  });

  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [savedRoles, setSavedRoles] = useState<Set<string>>(new Set());

  const allPermissions = matrix.allPermissions.flatMap((cat) =>
    cat.permissions.map((p) => ({ ...p, category: cat.category }))
  );

  const toggle = (roleId: string, permKey: string, isOwner: boolean) => {
    if (isOwner) return;
    setPermissions((prev) => {
      const next = new Set(prev[roleId]);
      if (next.has(permKey)) {
        next.delete(permKey);
      } else {
        next.add(permKey);
      }
      return { ...prev, [roleId]: next };
    });
    setSavedRoles((prev) => {
      const next = new Set(prev);
      next.delete(roleId);
      return next;
    });
  };

  const saveRole = async (roleId: string) => {
    setSavingRoleId(roleId);
    try {
      await onSaveRole(roleId, Array.from(permissions[roleId] ?? new Set()));
      setSavedRoles((prev) => new Set([...prev, roleId]));
    } finally {
      setSavingRoleId(null);
    }
  };

  const editableRoles = matrix.roles.filter((r) => r.name !== 'owner');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Role Permissions</h3>
          <p className="text-xs text-muted-foreground">
            Checkmarks enable a permission for that role
          </p>
        </div>
        <button
          onClick={onCreateRole}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          type="button"
        >
          + Custom Role
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="sticky left-0 z-10 min-w-48 bg-muted/80 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Permission
              </th>
              {matrix.roles.map((role) => (
                <th
                  key={role.id}
                  className="min-w-28 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {role.displayName}
                  {role.name === 'owner' && (
                    <span className="ml-1 text-yellow-500">★</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.allPermissions.map((category) => (
              <>
                <tr key={`cat-${category.category}`} className="bg-muted/30">
                  <td
                    colSpan={matrix.roles.length + 1}
                    className="px-4 py-2"
                  >
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-xs font-semibold capitalize',
                        CATEGORY_COLORS[category.category] ?? 'bg-muted text-muted-foreground',
                      ].join(' ')}
                    >
                      {category.category}
                    </span>
                  </td>
                </tr>
                {category.permissions.map((perm) => (
                  <tr key={perm.key} className="border-t border-border hover:bg-muted/20">
                    <td className="sticky left-0 z-10 bg-card px-4 py-2.5 text-xs text-foreground">
                      {perm.label}
                      <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                        {perm.key}
                      </span>
                    </td>
                    {matrix.roles.map((role) => {
                      const isOwner = role.name === 'owner';
                      const hasPermission = isOwner || permissions[role.id]?.has(perm.key);

                      return (
                        <td key={role.id} className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => toggle(role.id, perm.key, isOwner)}
                            disabled={isOwner}
                            className={[
                              'mx-auto flex h-5 w-5 items-center justify-center rounded transition-all',
                              isOwner
                                ? 'cursor-default opacity-50'
                                : 'cursor-pointer hover:scale-110',
                              hasPermission
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-border',
                            ].join(' ')}
                            type="button"
                            aria-label={`${hasPermission ? 'Revoke' : 'Grant'} ${perm.label} for ${role.displayName}`}
                          >
                            {hasPermission && (
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save buttons per role */}
      <div className="flex flex-wrap gap-3">
        {editableRoles.map((role) => (
          <button
            key={role.id}
            onClick={() => saveRole(role.id)}
            disabled={savingRoleId === role.id}
            className={[
              'rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50',
              savedRoles.has(role.id)
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
            ].join(' ')}
            type="button"
          >
            {savingRoleId === role.id
              ? 'Saving…'
              : savedRoles.has(role.id)
              ? `✓ ${role.displayName} saved`
              : `Save ${role.displayName}`}
          </button>
        ))}
      </div>
    </div>
  );
}
