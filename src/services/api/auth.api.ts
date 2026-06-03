import { httpClient } from './axios.instance';

export interface LoginDto {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  avatarUrl?: string;
  phone?: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'owner' | 'admin' | 'teacher' | 'student';

export type Permission =
  | 'students:read'
  | 'students:write'
  | 'students:delete'
  | 'teachers:read'
  | 'teachers:write'
  | 'teachers:delete'
  | 'courses:read'
  | 'courses:write'
  | 'courses:delete'
  | 'payments:read'
  | 'payments:write'
  | 'analytics:read'
  | 'admin:read'
  | 'admin:write'
  | 'owner:read'
  | 'owner:write'
  | 'notifications:read'
  | 'notifications:write';

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
  passwordConfirm: string;
}

export const authApi = {
  login: async (dto: LoginDto): Promise<AuthTokens & { user: UserProfile }> => {
    const { data } = await httpClient.post<AuthTokens & { user: UserProfile }>(
      '/auth/login',
      dto,
    );
    return data;
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const { data } = await httpClient.post<AuthTokens>('/auth/refresh', {
      refreshToken,
    });
    return data;
  },

  logout: async (): Promise<void> => {
    await httpClient.post('/auth/logout');
  },

  getMe: async (): Promise<UserProfile> => {
    const { data } = await httpClient.get<UserProfile>('/auth/me');
    return data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await httpClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await httpClient.post('/auth/reset-password', { token, password });
  },
};
