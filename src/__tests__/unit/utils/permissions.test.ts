import { describe, it, expect } from 'vitest';
import {
  can,
  canAny,
  canAll,
  isRoleOrHigher,
} from '@/shared/utils/permissions';
import type { UserProfile, UserRole, Permission } from '@/services/api/auth.api';

// Build a valid UserProfile using the exact shape from @/services/api/auth.api
const makeUser = (
  role: UserRole,
  permissions: Permission[] = [],
): UserProfile => ({
  id: `user-${role}`,
  email: `${role}@test.com`,
  firstName: 'Test',
  lastName: 'User',
  role,
  permissions,
  tenantId: 'tenant-1',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

// Owner bypasses all checks — no permissions array needed
const ownerUser = makeUser('owner', []);

// Admin permissions (subset of Permission type from auth.api)
const adminUser = makeUser('admin', [
  'students:read',
  'students:write',
  'students:delete',
  'teachers:read',
  'teachers:write',
  'courses:read',
  'courses:write',
  'courses:delete',
  'payments:read',
  'payments:write',
  'analytics:read',
  'admin:read',
  'admin:write',
  'notifications:read',
  'notifications:write',
]);

// Teacher permissions
const teacherUser = makeUser('teacher', [
  'students:read',
  'courses:read',
  'analytics:read',
  'notifications:read',
  'notifications:write',
]);

// Student permissions
const studentUser = makeUser('student', [
  'courses:read',
  'notifications:read',
]);

describe('can() — RBAC permission checks', () => {
  describe('owner role', () => {
    it('owner can owner:read (bypasses all checks)', () => {
      expect(can(ownerUser, 'owner:read')).toBe(true);
    });

    it('owner can owner:write', () => {
      expect(can(ownerUser, 'owner:write')).toBe(true);
    });

    it('owner can admin:write', () => {
      expect(can(ownerUser, 'admin:write')).toBe(true);
    });

    it('owner can analytics:read', () => {
      expect(can(ownerUser, 'analytics:read')).toBe(true);
    });

    it('owner can students:write', () => {
      expect(can(ownerUser, 'students:write')).toBe(true);
    });

    it('owner can payments:write', () => {
      expect(can(ownerUser, 'payments:write')).toBe(true);
    });

    it('owner can courses:read', () => {
      expect(can(ownerUser, 'courses:read')).toBe(true);
    });
  });

  describe('admin role', () => {
    it('admin can students:read', () => {
      expect(can(adminUser, 'students:read')).toBe(true);
    });

    it('admin can students:write', () => {
      expect(can(adminUser, 'students:write')).toBe(true);
    });

    it('admin can teachers:read', () => {
      expect(can(adminUser, 'teachers:read')).toBe(true);
    });

    it('admin can courses:write', () => {
      expect(can(adminUser, 'courses:write')).toBe(true);
    });

    it('admin can payments:write', () => {
      expect(can(adminUser, 'payments:write')).toBe(true);
    });

    it('admin can admin:read', () => {
      expect(can(adminUser, 'admin:read')).toBe(true);
    });

    it('CANNOT teachers:delete (not in admin permissions)', () => {
      expect(can(adminUser, 'teachers:delete')).toBe(false);
    });

    it('CANNOT owner:read (owner-only)', () => {
      expect(can(adminUser, 'owner:read')).toBe(false);
    });

    it('CANNOT owner:write (owner-only)', () => {
      expect(can(adminUser, 'owner:write')).toBe(false);
    });
  });

  describe('teacher role', () => {
    it('teacher can students:read', () => {
      expect(can(teacherUser, 'students:read')).toBe(true);
    });

    it('teacher can courses:read', () => {
      expect(can(teacherUser, 'courses:read')).toBe(true);
    });

    it('teacher can analytics:read', () => {
      expect(can(teacherUser, 'analytics:read')).toBe(true);
    });

    it('teacher can notifications:write', () => {
      expect(can(teacherUser, 'notifications:write')).toBe(true);
    });

    it('CANNOT students:write', () => {
      expect(can(teacherUser, 'students:write')).toBe(false);
    });

    it('CANNOT courses:write', () => {
      expect(can(teacherUser, 'courses:write')).toBe(false);
    });

    it('CANNOT payments:read', () => {
      expect(can(teacherUser, 'payments:read')).toBe(false);
    });

    it('CANNOT admin:read', () => {
      expect(can(teacherUser, 'admin:read')).toBe(false);
    });
  });

  describe('student role', () => {
    it('student can courses:read', () => {
      expect(can(studentUser, 'courses:read')).toBe(true);
    });

    it('student can notifications:read', () => {
      expect(can(studentUser, 'notifications:read')).toBe(true);
    });

    it('CANNOT students:write', () => {
      expect(can(studentUser, 'students:write')).toBe(false);
    });

    it('CANNOT courses:write', () => {
      expect(can(studentUser, 'courses:write')).toBe(false);
    });

    it('CANNOT analytics:read', () => {
      expect(can(studentUser, 'analytics:read')).toBe(false);
    });

    it('CANNOT admin:read', () => {
      expect(can(studentUser, 'admin:read')).toBe(false);
    });
  });

  describe('null / undefined user', () => {
    it('returns false for null user', () => {
      expect(can(null, 'courses:read')).toBe(false);
    });

    it('returns false for undefined user', () => {
      expect(can(undefined as unknown as null, 'courses:read')).toBe(false);
    });
  });
});

describe('canAny()', () => {
  it('returns true if user has at least one of the permissions', () => {
    expect(
      canAny(teacherUser, [
        'students:write', // false for teacher
        'students:read',  // true for teacher
      ])
    ).toBe(true);
  });

  it('returns false if user has none of the permissions', () => {
    expect(
      canAny(studentUser, [
        'students:write',
        'courses:write',
        'admin:read',
      ])
    ).toBe(false);
  });

  it('returns true for owner with any permissions (bypasses checks)', () => {
    expect(
      canAny(ownerUser, [
        'owner:read',
        'owner:write',
      ])
    ).toBe(true);
  });

  it('returns false for null user', () => {
    expect(canAny(null, ['courses:read'])).toBe(false);
  });

  it('returns false for empty permissions array', () => {
    expect(canAny(ownerUser, [])).toBe(false);
  });
});

describe('canAll()', () => {
  it('returns true only if user has ALL permissions', () => {
    expect(
      canAll(teacherUser, [
        'students:read',
        'courses:read',
        'analytics:read',
      ])
    ).toBe(true);
  });

  it('returns false if user is missing any one permission', () => {
    expect(
      canAll(teacherUser, [
        'students:read',   // true
        'students:write',  // false
      ])
    ).toBe(false);
  });

  it('returns true for owner with any combination (bypasses checks)', () => {
    expect(
      canAll(ownerUser, [
        'owner:read',
        'owner:write',
        'admin:write',
      ])
    ).toBe(true);
  });

  it('returns false for null user', () => {
    expect(canAll(null, ['courses:read'])).toBe(false);
  });

  it('returns true for empty permissions array (vacuously true)', () => {
    expect(canAll(studentUser, [])).toBe(true);
  });
});

describe('isRoleOrHigher()', () => {
  it('owner is higher than admin', () => {
    expect(isRoleOrHigher(ownerUser, 'admin')).toBe(true);
  });

  it('owner is higher than teacher', () => {
    expect(isRoleOrHigher(ownerUser, 'teacher')).toBe(true);
  });

  it('owner is higher than student', () => {
    expect(isRoleOrHigher(ownerUser, 'student')).toBe(true);
  });

  it('owner meets owner requirement', () => {
    expect(isRoleOrHigher(ownerUser, 'owner')).toBe(true);
  });

  it('admin is higher than teacher', () => {
    expect(isRoleOrHigher(adminUser, 'teacher')).toBe(true);
  });

  it('admin is higher than student', () => {
    expect(isRoleOrHigher(adminUser, 'student')).toBe(true);
  });

  it('admin meets admin requirement', () => {
    expect(isRoleOrHigher(adminUser, 'admin')).toBe(true);
  });

  it('admin does NOT meet owner requirement', () => {
    expect(isRoleOrHigher(adminUser, 'owner')).toBe(false);
  });

  it('teacher meets teacher requirement', () => {
    expect(isRoleOrHigher(teacherUser, 'teacher')).toBe(true);
  });

  it('teacher does NOT meet admin requirement', () => {
    expect(isRoleOrHigher(teacherUser, 'admin')).toBe(false);
  });

  it('student meets student requirement', () => {
    expect(isRoleOrHigher(studentUser, 'student')).toBe(true);
  });

  it('student does NOT meet teacher requirement', () => {
    expect(isRoleOrHigher(studentUser, 'teacher')).toBe(false);
  });

  it('role hierarchy: owner > admin > teacher > student', () => {
    expect(isRoleOrHigher(ownerUser, 'student')).toBe(true);
    expect(isRoleOrHigher(adminUser, 'student')).toBe(true);
    expect(isRoleOrHigher(teacherUser, 'student')).toBe(true);
    expect(isRoleOrHigher(studentUser, 'owner')).toBe(false);
    expect(isRoleOrHigher(studentUser, 'admin')).toBe(false);
    expect(isRoleOrHigher(studentUser, 'teacher')).toBe(false);
  });

  it('returns false for null user', () => {
    expect(isRoleOrHigher(null, 'student')).toBe(false);
  });
});