import type { UserProfile, Permission, UserRole } from '@/services/api/auth.api';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  teacher: 2,
  student: 1,
};

/**
 * Check if user has a specific permission.
 * Owners always pass (they have all permissions).
 */
export function can(
  user: UserProfile | null,
  permission: Permission,
): boolean {
  if (!user) return false;
  if (user.role === 'owner') return true;
  return user.permissions.includes(permission);
}

/**
 * Returns true if user has at least one of the given permissions.
 */
export function canAny(
  user: UserProfile | null,
  permissions: Permission[],
): boolean {
  return permissions.some((p) => can(user, p));
}

/**
 * Returns true if user has ALL of the given permissions.
 */
export function canAll(
  user: UserProfile | null,
  permissions: Permission[],
): boolean {
  return permissions.every((p) => can(user, p));
}

/**
 * Returns true if user's role exactly matches the given role.
 */
export function isRole(user: UserProfile | null, role: UserRole): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Returns true if user's role is equal to or higher than the given role.
 * Hierarchy: owner > admin > teacher > student
 */
export function isRoleOrHigher(
  user: UserProfile | null,
  role: UserRole,
): boolean {
  if (!user) return false;
  const userLevel = ROLE_HIERARCHY[user.role];
  const requiredLevel = ROLE_HIERARCHY[role];
  return userLevel >= requiredLevel;
}

// Re-export PERMISSIONS constant from shared constants for convenience
export { PERMISSIONS } from '@shared/constants/permissions';
