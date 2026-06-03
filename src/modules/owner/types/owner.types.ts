export interface GlobalKPIData {
  mrr: number;
  arr: number;
  totalUsers: number;
  totalBranches: number;
  activeCourses: number;
  monthlyEnrollments: number;
  revenueGrowthPercent: number;
  trends: OwnerTrends;
}

export interface OwnerTrends {
  mrrChange: number;
  usersChange: number;
  enrollmentsChange: number;
}

export interface BranchDto {
  id: string;
  name: string;
  address: string;
  managerId: string | null;
  managerName: string | null;
  studentCount: number;
  teacherCount: number;
  courseCount: number;
  monthlyRevenue: number;
  currency: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface BranchForm {
  name: string;
  address: string;
  managerId: string | null;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId: string | null;
  branchName: string | null;
  status: 'active' | 'inactive';
  lastLogin: string | null;
  createdAt: string;
}

export type UserRole = 'student' | 'teacher' | 'admin' | 'owner';

export interface RoleDto {
  id: string;
  name: UserRole;
  displayName: string;
  permissions: string[];
}

export interface PermissionMatrix {
  roles: RoleDto[];
  allPermissions: PermissionCategory[];
}

export interface PermissionCategory {
  category: string;
  permissions: Permission[];
}

export interface Permission {
  key: string;
  label: string;
}

export interface StaffDto {
  id: string;
  name: string;
  role: 'teacher' | 'admin';
  branchId: string;
  branchName: string;
  salary: number;
  currency: string;
  contractStatus: ContractStatus;
  hireDate: string;
}

export type ContractStatus = 'active' | 'expired' | 'pending';

export interface FinancialOverview {
  mrr: number;
  arr: number;
  totalPaid: number;
  totalOutstanding: number;
  currency: string;
  revenueByBranch: BranchRevenue[];
  paymentMethodBreakdown: PaymentMethodShare[];
  topStudents: TopStudent[];
  overdueTotal: number;
}

export interface BranchRevenue {
  branchName: string;
  revenue: number;
}

export interface PaymentMethodShare {
  method: string;
  amount: number;
  percent: number;
}

export interface TopStudent {
  studentId: string;
  studentName: string;
  totalPaid: number;
  currency: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  apiVersion: string;
  dbStatus: 'connected' | 'error';
  cacheStatus: 'connected' | 'error';
  uptime: number;
}

export interface SystemConfig {
  maintenanceMode: boolean;
  featureFlags: GlobalFeatureFlags;
  emailSmtp: SmtpConfig;
}

export interface GlobalFeatureFlags {
  payments: boolean;
  chat: boolean;
  certificates: boolean;
  exams: boolean;
  analytics: boolean;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  secure: boolean;
}

export interface MultiTenantChartData {
  globalRevenue: GlobalRevenuePoint[];
  branchComparison: BranchComparisonPoint[];
  userGrowth: GrowthPoint[];
  enrollmentTrends: GrowthPoint[];
}

export interface GlobalRevenuePoint {
  month: string;
  revenue: number;
}

export interface BranchComparisonPoint {
  period: string;
  [branchName: string]: number | string;
}

export interface GrowthPoint {
  month: string;
  count: number;
}
