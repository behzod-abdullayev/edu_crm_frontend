import type { UserRole } from '@shared/types/common.types';
import { ROUTES } from './routes';

export const USER_ROLES = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN:   'admin',
  OWNER:   'owner',
} as const satisfies Record<string, UserRole>;

export const ROLE_LABELS: Record<UserRole, Record<'uz' | 'en' | 'ru', string>> = {
  student: { uz: "O'quvchi",    en: 'Student',  ru: 'Студент'       },
  teacher: { uz: "O'qituvchi",  en: 'Teacher',  ru: 'Учитель'       },
  admin:   { uz: 'Admin',       en: 'Admin',    ru: 'Администратор' },
  owner:   { uz: 'Egasi',       en: 'Owner',    ru: 'Владелец'      },
};

/** Tailwind color class for each role badge */
export const ROLE_COLORS: Record<UserRole, string> = {
  student: 'bg-[var(--role-student)] text-[var(--text-inverse)]',
  teacher: 'bg-[var(--role-teacher)] text-[var(--text-inverse)]',
  admin:   'bg-[var(--role-admin)]   text-[var(--text-inverse)]',
  owner:   'bg-[var(--role-owner)]   text-[var(--text-inverse)]',
};

/** Lucide icon name for each role */
export const ROLE_ICONS: Record<UserRole, string> = {
  student: 'GraduationCap',
  teacher: 'BookOpen',
  admin:   'ShieldCheck',
  owner:   'Crown',
};

/** Default redirect route after login per role */
export const ROLE_DEFAULT_ROUTES: Record<UserRole, string> = {
  student: ROUTES.STUDENT.DASHBOARD,
  teacher: ROUTES.TEACHER.DASHBOARD,
  admin:   ROUTES.ADMIN.DASHBOARD,
  owner:   ROUTES.OWNER.DASHBOARD,
};

/** Route prefix for each role (used by middleware) */
export const ROLE_ROUTE_PREFIX: Record<UserRole, string> = {
  student: '/student',
  teacher: '/teacher',
  admin:   '/admin',
  owner:   '/owner',
};
