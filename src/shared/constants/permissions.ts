import type { Permission } from '@shared/types/auth.types';
import type { UserRole } from '@shared/types/common.types';

/** All permission strings as typed constants */
export const PERMISSIONS = {
  // Student management
  STUDENT_VIEW:   'student.view',
  STUDENT_CREATE: 'student.create',
  STUDENT_UPDATE: 'student.update',
  STUDENT_DELETE: 'student.delete',

  // Teacher management
  TEACHER_VIEW:   'teacher.view',
  TEACHER_CREATE: 'teacher.create',
  TEACHER_UPDATE: 'teacher.update',
  TEACHER_DELETE: 'teacher.delete',

  // Course management
  COURSE_VIEW:    'course.view',
  COURSE_CREATE:  'course.create',
  COURSE_UPDATE:  'course.update',
  COURSE_DELETE:  'course.delete',

  // Payments
  PAYMENT_VIEW:   'payment.view',
  PAYMENT_MANAGE: 'payment.manage',
  PAYMENT_REFUND: 'payment.refund',

  // Attendance
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_MARK: 'attendance.mark',

  // Homework
  HOMEWORK_VIEW:   'homework.view',
  HOMEWORK_CREATE: 'homework.create',
  HOMEWORK_GRADE:  'homework.grade',

  // Exams
  EXAM_VIEW:   'exam.view',
  EXAM_CREATE: 'exam.create',
  EXAM_MANAGE: 'exam.manage',

  // Reports & analytics
  REPORT_VIEW:    'report.view',
  REPORT_EXPORT:  'report.export',
  ANALYTICS_VIEW: 'analytics.view',

  // Schedule
  SCHEDULE_VIEW:   'schedule.view',
  SCHEDULE_MANAGE: 'schedule.manage',

  // Notifications
  NOTIFICATION_VIEW: 'notification.view',
  NOTIFICATION_SEND: 'notification.send',

  // Roles
  ROLE_VIEW:   'role.view',
  ROLE_MANAGE: 'role.manage',

  // Branches
  BRANCH_VIEW:   'branch.view',
  BRANCH_MANAGE: 'branch.manage',

  // System
  SYSTEM_CONFIG: 'system.config',
  SYSTEM_MANAGE: 'system.manage',
} as const satisfies Record<string, Permission>;

/** Default permissions granted to each role */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  student: [
    'student.view',
    'course.view',
    'attendance.view',
    'homework.view',
    'exam.view',
    'schedule.view',
    'notification.view',
    'report.view',
  ],

  teacher: [
    'student.view',
    'course.view',
    'attendance.view',
    'attendance.mark',
    'homework.view',
    'homework.create',
    'homework.grade',
    'exam.view',
    'exam.create',
    'schedule.view',
    'notification.view',
    'notification.send',
    'analytics.view',
    'report.view',
  ],

  admin: [
    'student.view', 'student.create', 'student.update', 'student.delete',
    'teacher.view', 'teacher.create', 'teacher.update',
    'course.view',  'course.create',  'course.update',  'course.delete',
    'payment.view', 'payment.manage',
    'attendance.view', 'attendance.mark',
    'homework.view',   'homework.create', 'homework.grade',
    'exam.view',       'exam.create',     'exam.manage',
    'schedule.view',   'schedule.manage',
    'notification.view', 'notification.send',
    'report.view',     'report.export',
    'analytics.view',
    'branch.view',
    'role.view',
  ],

  owner: [
    'student.view', 'student.create', 'student.update', 'student.delete',
    'teacher.view', 'teacher.create', 'teacher.update', 'teacher.delete',
    'course.view',  'course.create',  'course.update',  'course.delete',
    'payment.view', 'payment.manage', 'payment.refund',
    'attendance.view', 'attendance.mark',
    'homework.view',   'homework.create', 'homework.grade',
    'exam.view',       'exam.create',     'exam.manage',
    'schedule.view',   'schedule.manage',
    'notification.view', 'notification.send',
    'report.view',     'report.export',
    'analytics.view',
    'role.view',   'role.manage',
    'branch.view', 'branch.manage',
    'system.config', 'system.manage',
  ],
};
