// FIX XATO 3 + XATO 15: super_admin roli qo'shildi.
// Avval: 'student' | 'teacher' | 'admin' | 'owner'
// Endi:  'student' | 'teacher' | 'admin' | 'owner' | 'super_admin'
// Bu fix bir vaqtda:
//   - owner.types.ts dagi UserRole type ni to'g'irlaydi (XATO 3)
//   - middleware.ts va page.tsx dagi super_admin route guard uchun type bazasini ta'minlaydi (XATO 15)
//   - OwnerUsersClient dagi ROLE_BADGE_CLASSES va ALL_ROLES ni to'g'irlashga imkon beradi (XATO 3)
export type UserRole = 'student' | 'teacher' | 'admin' | 'owner' | 'super_admin';

export type ContractStatus = 'active' | 'expired' | 'pending';

// ---------------------------------------------------------------------------
// KPI & Trends
// ---------------------------------------------------------------------------

export interface GlobalKPIData {
  mrr: number;
  arr: number;
  totalUsers: number;
  totalBranches: number;
  activeCourses: number;
  monthlyEnrollments: number;
  revenueGrowthPercent: number;
  trends: OwnerTrends;
  // Sparkline mini-chart data (optional — populated from analytics endpoint when available)
  mrrSparkline?: { value: number }[];
  usersSparkline?: { value: number }[];
  enrollmentsSparkline?: { value: number }[];
}

export interface OwnerTrends {
  mrrChange: number;
  usersChange: number;
  enrollmentsChange: number;
}

// ---------------------------------------------------------------------------
// Branch
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Roles & Permissions
// ---------------------------------------------------------------------------

export interface RoleDto {
  id: string;
  name: UserRole;
  displayName: string;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
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

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Financials
// ---------------------------------------------------------------------------

export interface FinancialOverview {
  mrr: number;
  arr: number;
  // Total cash inflow from students (sum of all paid payments)
  totalIncome: number;
  // Total cash outflow (active staff payroll, aggregated from HR module)
  totalExpenses: number;
  // Strictly: netProfit = totalIncome - totalExpenses
  netProfit: number;
  totalPaid: number;
  totalOutstanding: number;
  currency: string;
  revenueByBranch: BranchRevenue[];
  paymentMethodBreakdown: PaymentMethodShare[];
  topStudents: TopStudent[];
  overdueTotal: number;
  // Cash inflow/outflow broken down per Course
  courseBreakdown: CourseFinanceBreakdown[];
  // Cash inflow/outflow broken down per individual student
  studentBreakdown: StudentFinanceBreakdown[];
}

export interface BranchRevenue {
  branchName: string;
  revenue: number;
  expenses: number;
  netProfit: number;
}

export interface CourseFinanceBreakdown {
  courseId: string;
  courseName: string;
  income: number;
  expenses: number;
  netProfit: number;
  currency: string;
}

export interface StudentFinanceBreakdown {
  studentId: string;
  studentName: string;
  branch: string | null;
  inflow: number;
  outflow: number;
  netProfit: number;
  currency: string;
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

// ---------------------------------------------------------------------------
// System
// ---------------------------------------------------------------------------

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  apiVersion: string;
  dbStatus: 'connected' | 'error';
  cacheStatus: 'connected' | 'error';
  uptime: number;
  services: { name: string; status: 'up' | 'down'; latencyMs?: number }[];
  timestamp: string;
}

export interface SystemConfig {
  maintenanceMode: boolean;
  featureFlags: GlobalFeatureFlags;
  emailSmtp: SmtpConfig;
  registrationEnabled: boolean;
  maxStudentsPerClass: number;
  defaultCurrency: string;
  timezone: string;
  supportEmail: string;
}

export interface GlobalFeatureFlags {
  payments: boolean;
  chat: boolean;
  certificates: boolean;
  exams: boolean;
  analytics: boolean;
}

// XATO 6 FIX: password maydoni qo'shildi
export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string; // ← XATO 6 FIX: avval yo'q edi
  secure: boolean;
}

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------

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