import type { StudentListParams } from '@/services/api/students.api';
import type { TeacherListParams } from '@/services/api/teachers.api';
import type { CourseListParams } from '@/services/api/courses.api';
import type { PaymentListParams } from '@/services/api/payments.api';
import type { AdminListParams } from '@/services/api/admin.api';
import type { NotificationListParams } from '@/services/api/notifications.api';

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const queryKeys = {
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (p: StudentListParams) => [...queryKeys.students.lists(), p] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.students.details(), id] as const,
    courses: (id: string) => [...queryKeys.students.detail(id), 'courses'] as const,
    attendance: (id: string) => [...queryKeys.students.detail(id), 'attendance'] as const,
    grades: (id: string) => [...queryKeys.students.detail(id), 'grades'] as const,
    schedule: (id: string) => [...queryKeys.students.detail(id), 'schedule'] as const,
    certificates: (id: string) => [...queryKeys.students.detail(id), 'certificates'] as const,
    notifications: (id: string) => [...queryKeys.students.detail(id), 'notifications'] as const,
  },

  teachers: {
    all: ['teachers'] as const,
    lists: () => [...queryKeys.teachers.all, 'list'] as const,
    list: (p: TeacherListParams) => [...queryKeys.teachers.lists(), p] as const,
    details: () => [...queryKeys.teachers.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.teachers.details(), id] as const,
    courses: (id: string) => [...queryKeys.teachers.detail(id), 'courses'] as const,
    schedule: (id: string) => [...queryKeys.teachers.detail(id), 'schedule'] as const,
    salary: (id: string) => [...queryKeys.teachers.detail(id), 'salary'] as const,
    analytics: (id: string) => [...queryKeys.teachers.detail(id), 'analytics'] as const,
  },

  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (p: CourseListParams) => [...queryKeys.courses.lists(), p] as const,
    details: () => [...queryKeys.courses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.courses.details(), id] as const,
    lessons: (id: string) => [...queryKeys.courses.detail(id), 'lessons'] as const,
    enrollments: (id: string) => [...queryKeys.courses.detail(id), 'enrollments'] as const,
    homework: (id: string) => [...queryKeys.courses.detail(id), 'homework'] as const,
    submissions: (courseId: string, homeworkId: string) =>
      [...queryKeys.courses.homework(courseId), homeworkId, 'submissions'] as const,
    analytics: (id: string) => [...queryKeys.courses.detail(id), 'analytics'] as const,
  },

  payments: {
    all: ['payments'] as const,
    lists: () => [...queryKeys.payments.all, 'list'] as const,
    list: (p: PaymentListParams) => [...queryKeys.payments.lists(), p] as const,
    details: () => [...queryKeys.payments.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.payments.details(), id] as const,
    summary: (params?: { from?: string; to?: string }) =>
      [...queryKeys.payments.all, 'summary', params] as const,
    debts: (p?: PaginationParams) => [...queryKeys.payments.all, 'debts', p] as const,
  },

  admin: {
    all: ['admin'] as const,
    dashboard: () => [...queryKeys.admin.all, 'dashboard'] as const,
    staff: {
      all: () => [...queryKeys.admin.all, 'staff'] as const,
      lists: () => [...queryKeys.admin.staff.all(), 'list'] as const,
      list: (p: AdminListParams) => [...queryKeys.admin.staff.lists(), p] as const,
      details: () => [...queryKeys.admin.staff.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.admin.staff.details(), id] as const,
    },
    groups: {
      all: () => [...queryKeys.admin.all, 'groups'] as const,
      lists: () => [...queryKeys.admin.groups.all(), 'list'] as const,
      list: (p: PaginationParams) => [...queryKeys.admin.groups.lists(), p] as const,
      details: () => [...queryKeys.admin.groups.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.admin.groups.details(), id] as const,
    },
    auditLogs: (p?: PaginationParams) =>
      [...queryKeys.admin.all, 'audit-logs', p] as const,
    analytics: (params?: { from?: string; to?: string }) =>
      [...queryKeys.admin.all, 'analytics', params] as const,
  },

  owner: {
    all: ['owner'] as const,
    dashboard: () => [...queryKeys.owner.all, 'dashboard'] as const,
    tenants: {
      all: () => [...queryKeys.owner.all, 'tenants'] as const,
      lists: () => [...queryKeys.owner.tenants.all(), 'list'] as const,
      list: (p: PaginationParams) => [...queryKeys.owner.tenants.lists(), p] as const,
      details: () => [...queryKeys.owner.tenants.all(), 'detail'] as const,
      detail: (id: string) => [...queryKeys.owner.tenants.details(), id] as const,
    },
    branches: {
      all: () => [...queryKeys.owner.all, 'branches'] as const,
      lists: () => [...queryKeys.owner.branches.all(), 'list'] as const,
      list: (p?: PaginationParams) => [...queryKeys.owner.branches.lists(), p] as const,
      detail: (id: string) => [...queryKeys.owner.branches.all(), 'detail', id] as const,
    },
    roles: () => [...queryKeys.owner.all, 'roles'] as const,
    users: {
      all: () => [...queryKeys.owner.all, 'users'] as const,
      list: (p?: PaginationParams & { role?: string }) =>
        [...queryKeys.owner.users.all(), p] as const,
    },
    finances: () => [...queryKeys.owner.all, 'finances'] as const,
    hr: (p?: PaginationParams) => [...queryKeys.owner.all, 'hr', p] as const,
    systemConfig: () => [...queryKeys.owner.all, 'system-config'] as const,
    billing: (p?: PaginationParams) =>
      [...queryKeys.owner.all, 'billing', p] as const,
    health: () => [...queryKeys.owner.all, 'health'] as const,
    analytics: (params?: { from?: string; to?: string }) =>
      [...queryKeys.owner.all, 'analytics', params] as const,
  },

  schedules: {
    all: ['schedules'] as const,
    calendar: (params: { from: string; to: string; groupId?: string; teacherId?: string }) =>
      [...queryKeys.schedules.all, 'calendar', params] as const,
  },

  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (params: NotificationListParams) =>
      [...queryKeys.notifications.lists(), params] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
    preferences: () => [...queryKeys.notifications.all, 'preferences'] as const,
  },

  auth: {
    me: ['auth', 'me'] as const,
    session: ['auth', 'session'] as const,
  },
} as const;