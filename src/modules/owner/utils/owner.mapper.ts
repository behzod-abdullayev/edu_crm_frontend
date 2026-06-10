import { format } from 'date-fns';
import type {
  BranchDto,
  UserDto,
  StaffDto,
  BranchRevenue,
  PaymentMethodShare,
  TopStudent,
  SystemConfig,
  GlobalFeatureFlags,
} from '../types/owner.types';

// ── Display row interfaces ─────────────────────────────────────────────────────

export interface BranchDisplayRow {
  id: string;
  name: string;
  address: string;
  managerName: string;
  studentCount: number;
  monthlyRevenue: string;
  status: string;
}

export interface UserDisplayRow {
  id: string;
  name: string;
  email: string;
  role: string;
  branchName: string;
  status: string;
  lastLogin: string;
}

export interface StaffDisplayRow {
  id: string;
  name: string;
  role: string;
  branchName: string;
  salary: string;
  contractStatus: string;
  hireDate: string;
}

// ── SystemConfig mapper (XATO 1 FIX) ─────────────────────────────────────────
//
// Backend GET /owner/system/config ya /owner/config qaytaradi:
// { name, slug, domain, timezone, default_language, currency,
//   feature_flags: Record<string, boolean>, branches, subscription_plan }
//
// Frontend SystemConfig kutadi:
// { maintenanceMode: boolean, featureFlags: {...}, emailSmtp: {...} }
//
// Bu mapper TenantRow → SystemConfig shape ga to'g'ri o'giradi.

interface TenantRow {
  name?: string;
  slug?: string;
  domain?: string;
  timezone?: string;
  default_language?: string;
  currency?: string;
  feature_flags?: Record<string, boolean>;
  branches?: unknown[];
  subscription_plan?: string;
  // Agar kelajakda backend maintenanceMode qo'shsa:
  maintenanceMode?: boolean;
  maintenance_mode?: boolean;
  // Agar kelajakda backend emailSmtp qo'shsa:
  emailSmtp?: Partial<SystemConfig['emailSmtp']>;
  email_smtp?: Partial<SystemConfig['emailSmtp']>;
}

const DEFAULT_FEATURE_FLAGS: GlobalFeatureFlags = {
  payments: true,
  chat: true,
  certificates: true,
  exams: true,
  analytics: true,
};

const DEFAULT_SMTP: SystemConfig['emailSmtp'] = {
  host: '',
  port: 587,
  user: '',
  password: '',
  secure: false,
};

/**
 * Backend TenantRow → Frontend SystemConfig
 *
 * XATO 1 FIX:
 * - feature_flags (snake_case) → featureFlags (camelCase)
 * - maintenanceMode backend qo'llab-quvvatlamaguncha false
 * - emailSmtp backend qo'llab-quvvatlamaguncha default qiymatlar
 */
export function mapTenantRowToSystemConfig(
  row: TenantRow | null | undefined,
): SystemConfig {
  if (!row) {
    return {
      maintenanceMode: false,
      featureFlags: { ...DEFAULT_FEATURE_FLAGS },
      emailSmtp: { ...DEFAULT_SMTP },
      registrationEnabled: true,
      maxStudentsPerClass: 30,
      defaultCurrency: 'USD',
      timezone: 'UTC',
      supportEmail: '',
    };
  }

  // feature_flags backend field (snake_case) → featureFlags (camelCase)
  const rawFlags = row.feature_flags ?? {};

  const featureFlags: GlobalFeatureFlags = {
    payments:     rawFlags['payments']     ?? DEFAULT_FEATURE_FLAGS.payments,
    chat:         rawFlags['chat']         ?? DEFAULT_FEATURE_FLAGS.chat,
    certificates: rawFlags['certificates'] ?? DEFAULT_FEATURE_FLAGS.certificates,
    exams:        rawFlags['exams']        ?? DEFAULT_FEATURE_FLAGS.exams,
    analytics:    rawFlags['analytics']    ?? DEFAULT_FEATURE_FLAGS.analytics,
  };

  // maintenanceMode: backend hali qo'llab-quvvatlamaydi → false
  const maintenanceMode =
    row.maintenanceMode ??
    row.maintenance_mode ??
    false;

  // emailSmtp: backend hali qo'llab-quvvatlamaydi → default qiymatlar
  const rawSmtp = row.emailSmtp ?? row.email_smtp ?? {};
  const emailSmtp: SystemConfig['emailSmtp'] = {
    host:     rawSmtp.host     ?? DEFAULT_SMTP.host,
    port:     rawSmtp.port     ?? DEFAULT_SMTP.port,
    user:     rawSmtp.user     ?? DEFAULT_SMTP.user,
    password: rawSmtp.password ?? DEFAULT_SMTP.password,
    secure:   rawSmtp.secure   ?? DEFAULT_SMTP.secure,
  };

  return {
    maintenanceMode,
    featureFlags,
    emailSmtp,
    registrationEnabled: true,
    maxStudentsPerClass: 30,
    defaultCurrency: row.currency ?? 'USD',
    timezone: row.timezone ?? 'UTC',
    supportEmail: '',
  };
}

/**
 * Frontend SystemConfig → Backend UpdateSystemConfigDto
 *
 * XATO 2 FIX:
 * Backend faqat featureFlags qabul qiladi:
 * { timezone?, defaultLanguage?, currency?, featureFlags?: Record<string, boolean> }
 *
 * maintenanceMode va emailSmtp backend qo'llab-quvvatlamaguncha YUBORILMAYDI —
 * ular backendda saqlanmaydi, shuning uchun yuborish befoyda.
 */
export interface UpdateSystemConfigDto {
  featureFlags: Record<string, boolean>;
  // timezone, currency, defaultLanguage kelajakda qo'shilishi mumkin
}

export function mapSystemConfigToDto(config: SystemConfig): UpdateSystemConfigDto {
  return {
    featureFlags: {
      payments:     config.featureFlags.payments,
      chat:         config.featureFlags.chat,
      certificates: config.featureFlags.certificates,
      exams:        config.featureFlags.exams,
      analytics:    config.featureFlags.analytics,
    },
    // maintenanceMode va emailSmtp YUBORILMAYDI — backend qabul qilmaydi
  };
}

// ── Existing mappers ───────────────────────────────────────────────────────────

export function mapBranchDtoToRow(dto: BranchDto): BranchDisplayRow {
  return {
    id: dto.id,
    name: dto.name,
    address: dto.address,
    managerName: dto.managerName ?? 'Unassigned',
    studentCount: dto.studentCount,
    monthlyRevenue: `${dto.monthlyRevenue.toLocaleString()} ${dto.currency}`,
    status: dto.status,
  };
}

export function mapUserDtoToRow(dto: UserDto): UserDisplayRow {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    role: dto.role,
    branchName: dto.branchName ?? 'All Branches',
    status: dto.status,
    lastLogin: dto.lastLogin
      ? format(new Date(dto.lastLogin), 'dd MMM yyyy HH:mm')
      : 'Never',
  };
}

export function mapStaffDtoToRow(dto: StaffDto): StaffDisplayRow {
  return {
    id: dto.id,
    name: dto.name,
    role: dto.role,
    branchName: dto.branchName,
    salary: `${dto.salary.toLocaleString()} ${dto.currency}`,
    contractStatus: dto.contractStatus,
    hireDate: format(new Date(dto.hireDate), 'dd MMM yyyy'),
  };
}

export function mapBranchRevenueToPie(
  data: BranchRevenue[],
): { name: string; value: number }[] {
  return data.map((b) => ({ name: b.branchName, value: b.revenue }));
}

export function mapPaymentMethodsToChart(
  data: PaymentMethodShare[],
): { method: string; share: number }[] {
  return data.map((m) => ({ method: m.method, share: m.percent }));
}

export function mapTopStudentsToBadges(data: TopStudent[]): {
  name: string;
  totalPaid: string;
}[] {
  return data.map((s) => ({
    name: s.studentName,
    totalPaid: `${s.totalPaid.toLocaleString()} ${s.currency}`,
  }));
}