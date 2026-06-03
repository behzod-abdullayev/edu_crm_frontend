export const API_CONFIG = {
  baseUrl:    process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000',
  apiVersion: 'v1',
  timeout: {
    default:  15_000,
    upload:   60_000,
    download: 30_000,
  },
  retry: {
    count: 3,
    delay: 1_000,
    backoffMultiplier: 2,
    retryableStatuses: [408, 429, 500, 502, 503, 504] as readonly number[],
  },
  headers: {
    contentType:   'Content-Type',
    authorization: 'Authorization',
    tenantSlug:    'X-Tenant-Slug',
    requestId:     'X-Request-ID',
    locale:        'Accept-Language',
  },
  endpoints: {
    auth: {
      login:         '/api/v1/auth/login',
      logout:        '/api/v1/auth/logout',
      refresh:       '/api/v1/auth/refresh',
      me:            '/api/v1/auth/me',
      forgotPassword:'/api/v1/auth/forgot-password',
      resetPassword: '/api/v1/auth/reset-password',
    },
    students:     '/api/v1/students',
    teachers:     '/api/v1/teachers',
    courses:      '/api/v1/courses',
    groups:       '/api/v1/groups',
    attendance:   '/api/v1/attendance',
    homework:     '/api/v1/homework',
    payments:     '/api/v1/payments',
    reports:      '/api/v1/reports',
    analytics:    '/api/v1/analytics',
    schedule:     '/api/v1/schedule',
    notifications:'/api/v1/notifications',
    roles:        '/api/v1/roles',
    branches:     '/api/v1/branches',
    upload:       '/api/v1/upload',
    health:       '/api/v1/health',
  },
} as const;

export type ApiEndpointKey = keyof typeof API_CONFIG.endpoints;
