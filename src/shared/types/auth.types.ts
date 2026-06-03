import type { ID, Timestamp, UserRole, Nullable } from './common.types';

/** All permission strings in the platform */
export type Permission =
  | 'student.view'   | 'student.create'   | 'student.update'   | 'student.delete'
  | 'teacher.view'   | 'teacher.create'   | 'teacher.update'   | 'teacher.delete'
  | 'course.view'    | 'course.create'    | 'course.update'    | 'course.delete'
  | 'payment.view'   | 'payment.manage'   | 'payment.refund'
  | 'attendance.view'| 'attendance.mark'
  | 'homework.view'  | 'homework.create'  | 'homework.grade'
  | 'exam.view'      | 'exam.create'      | 'exam.manage'
  | 'report.view'    | 'report.export'
  | 'analytics.view'
  | 'schedule.view'  | 'schedule.manage'
  | 'notification.view' | 'notification.send'
  | 'role.view'      | 'role.manage'
  | 'branch.view'    | 'branch.manage'
  | 'system.config'  | 'system.manage';

/** Login request payload */
export interface LoginDto {
  email: string;
  password: string;
  tenantSlug?: string;
}

/** JWT token pair */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/** Authenticated user profile */
export interface UserProfile {
  id: ID;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  avatar: Nullable<string>;
  tenantId: ID;
  tenantSlug: string;
  phone: Nullable<string>;
  isEmailVerified: boolean;
  lastLoginAt: Nullable<Timestamp>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Full auth state (tokens + profile) */
export interface AuthState {
  user: Nullable<UserProfile>;
  tokens: Nullable<AuthTokens>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

/** Password reset request */
export interface ForgotPasswordDto {
  email: string;
}

/** Password reset confirmation */
export interface ResetPasswordDto {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/** Refresh token request */
export interface RefreshTokenDto {
  refreshToken: string;
}

/**
 * Alias for UserProfile — used in test files and permission checks.
 */
export type AuthUser = UserProfile;
