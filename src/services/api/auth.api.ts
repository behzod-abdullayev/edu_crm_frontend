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

/**
 * Backend MeResponseDto bilan to'liq mos:
 * { id, email, firstName, lastName, role, status, tenantId,
 *   profilePictureUrl, phone, preferredLanguage, twoFactorEnabled, permissions }
 *
 * avatarUrl / isActive / createdAt / updatedAt — eski field nomlar,
 * backend qaytarmaydi. Ular ixtiyoriy sifatida saqlanadi (UI code uchun).
 *
 * exactOptionalPropertyTypes: true — optional fieldlar uchun `string | undefined`
 * emas, balki key umuman bo'lmasligi mumkin. Shuning uchun bu fieldlar
 * `string | undefined` emas, `string` tipida (key absent = undefined holat).
 */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  tenantId: string;
  // Backend MeResponseDto field nomlari
  profilePictureUrl: string | null;
  phone: string | null;
  preferredLanguage: string;
  twoFactorEnabled: boolean;
  // Teacher profile ID (teachers.id) — present only for role === 'teacher'.
  // Required for all /teachers/:id/* endpoints (teachers.id !== users.id).
  teacherId: string | null;
  // Legacy opsional fieldlar — eski komponentlar uchun
  // exactOptionalPropertyTypes: true → bu fieldlar key absent yoki `string` (isActive: boolean)
  // `string | undefined` assign qilib bo'lmaydi — conditional spread ishlatish shart
  avatarUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type UserRole = 'owner' | 'admin' | 'teacher' | 'student' | 'super_admin';

export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'blocked';

/**
 * Backend permissions.util.ts dagi ROLE_PERMISSIONS bilan mos format:
 * 'student.view', 'course.create', 'payment.manage', '*' etc.
 * Loose string type — backend runtime qiymatlariga mos.
 */
export type Permission = string;

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
  passwordConfirm: string;
}

/** Backend LoginResponseDto: { accessToken, refreshToken, user: MeResponseDto } */
interface BackendLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

/**
 * exactOptionalPropertyTypes-safe legacy field mapper.
 *
 * `profilePictureUrl ?? undefined` → `string | undefined` → optional field ga
 * assign bo'lmaydi. Yechim: null bo'lsa field ni umuman qo'shmaslik (conditional
 * spread), string bo'lsa { avatarUrl: string } spread qilish.
 *
 * isActive: har doim boolean hisoblash mumkin (status !== undefined doim), lekin
 * optional field ekan — xuddi shu pattern.
 */
function mapLegacyFields(user: UserProfile): UserProfile {
  const avatarSpread =
    user.profilePictureUrl !== null
      ? { avatarUrl: user.profilePictureUrl }
      : {};

  const isActiveSpread: { isActive: boolean } = {
    isActive: user.status === 'active',
  };

  return { ...user, ...avatarSpread, ...isActiveSpread };
}

export const authApi = {
  login: async (dto: LoginDto): Promise<AuthTokens & { user: UserProfile }> => {
    const { data } = await httpClient.post<BackendLoginResponse>('/auth/login', dto);
    return {
      accessToken:  data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn:    900, // backend qaytarmaydi — default 15m
      user:         mapLegacyFields(data.user),
    };
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const { data } = await httpClient.post<{ accessToken: string; refreshToken?: string }>(
      '/auth/refresh',
      { refreshToken },
    );
    return {
      accessToken:  data.accessToken,
      refreshToken: data.refreshToken ?? refreshToken,
      expiresIn:    900,
    };
  },

  logout: async (): Promise<void> => {
    await httpClient.post('/auth/logout');
  },

  getMe: async (): Promise<UserProfile> => {
    // To'g'ridan backend ga murojaat CSP tomonidan bloklanadi (http://localhost:4001).
    // Next.js /api/auth/me proxy route orqali yuboramiz — server-side fetch da CSP ta'sir qilmaydi.
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include', // HTTP-only cookie ni yuborish uchun
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Unauthorized' }));
      throw { statusCode: res.status, message: (err as { message?: string }).message ?? 'Unauthorized' };
    }
    const data = await res.json() as UserProfile;
    return mapLegacyFields(data);
  },

  forgotPassword: async (email: string): Promise<void> => {
    await httpClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await httpClient.post('/auth/reset-password', { token, password });
  },
};