/**
 * RBAC permission checker.
 * This file is referenced from all admin/owner pages in Part 6.
 * The full implementation lives in Part 1–5 (auth module).
 * This re-exports it for use across the module.
 */

export type { UserProfile as User } from '@/shared/types/auth.types';

/**
 * Check if a user has a given permission key.
 * Owner always returns true. Roles are checked against the permission matrix.
 *
 * @example
 * can(user, 'course.delete')  // true for admin/owner, false for teacher
 * can(user, 'payment.refund') // true for admin/owner only
 */
export function can(
  user: { role: string; permissions?: string[] } | null | undefined,
  permission: string
): boolean {
  if (!user) return false;
  if (user.role === 'owner') return true;
  if (user.permissions) return user.permissions.includes(permission);

  // Fallback role-based defaults (overridden by matrix in full impl)
  const adminDefaults: string[] = [
    'course.view', 'course.create', 'course.update', 'course.delete',
    'teacher.view', 'teacher.update',
    'student.view', 'student.create', 'student.update',
    'payment.view', 'payment.manage', 'payment.refund',
    'schedule.manage',
    'system.config',
  ];

  const teacherDefaults: string[] = [
    'course.view',
    'student.view',
    'schedule.manage',
  ];

  const studentDefaults: string[] = [
    'course.view',
  ];

  const roleMap: Record<string, string[]> = {
    admin: adminDefaults,
    teacher: teacherDefaults,
    student: studentDefaults,
  };

  return roleMap[user.role]?.includes(permission) ?? false;
}
