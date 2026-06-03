/** All application routes as typed constants */
export const ROUTES = {
  AUTH: {
    LOGIN:            '/login',
    FORGOT_PASSWORD:  '/forgot-password',
    RESET_PASSWORD:   '/reset-password',
  },

  STUDENT: {
    DASHBOARD:        '/student/dashboard',
    COURSES:          '/student/courses',
    COURSE_DETAIL:    (id: string) => `/student/courses/${id}`,
    SCHEDULE:         '/student/schedule',
    ATTENDANCE:       '/student/attendance',
    HOMEWORK:         '/student/homework',
    HOMEWORK_DETAIL:  (id: string) => `/student/homework/${id}`,
    GRADES:           '/student/grades',
    EXAMS:            '/student/exams',
    CERTIFICATES:     '/student/certificates',
    NOTIFICATIONS:    '/student/notifications',
    PROFILE:          '/student/profile',
  },

  TEACHER: {
    DASHBOARD:        '/teacher/dashboard',
    GROUPS:           '/teacher/groups',
    GROUP_DETAIL:     (id: string) => `/teacher/groups/${id}`,
    ATTENDANCE:       '/teacher/attendance',
    HOMEWORK:         '/teacher/homework',
    HOMEWORK_CREATE:  '/teacher/homework/create',
    LESSONS:          '/teacher/lessons',
    LESSONS_UPLOAD:   '/teacher/lessons/upload',
    STUDENTS:         '/teacher/students',
    STUDENT_DETAIL:   (id: string) => `/teacher/students/${id}`,
    EXAMS:            '/teacher/exams',
    CHAT:             '/teacher/chat',
    ANALYTICS:        '/teacher/analytics',
    PROFILE:          '/teacher/profile',
  },

  ADMIN: {
    DASHBOARD:        '/admin/dashboard',
    COURSES:          '/admin/courses',
    COURSE_DETAIL:    (id: string) => `/admin/courses/${id}`,
    TEACHERS:         '/admin/teachers',
    STUDENTS:         '/admin/students',
    SCHEDULE:         '/admin/schedule',
    PAYMENTS:         '/admin/payments',
    PAYMENT_DETAIL:   (id: string) => `/admin/payments/${id}`,
    REPORTS:          '/admin/reports',
    ANALYTICS:        '/admin/analytics',
    SETTINGS:         '/admin/settings',
  },

  OWNER: {
    DASHBOARD:        '/owner/dashboard',
    USERS:            '/owner/users',
    ROLES:            '/owner/roles',
    BRANCHES:         '/owner/branches',
    ANALYTICS:        '/owner/analytics',
    FINANCES:         '/owner/finances',
    HR:               '/owner/hr',
    SYSTEM:           '/owner/system',
  },
} as const;

/** Public routes that don't require authentication */
export const PUBLIC_ROUTES: readonly string[] = [
  ROUTES.AUTH.LOGIN,
  ROUTES.AUTH.FORGOT_PASSWORD,
  ROUTES.AUTH.RESET_PASSWORD,
] as const;
