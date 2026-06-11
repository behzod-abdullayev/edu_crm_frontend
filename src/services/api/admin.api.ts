import { httpClient } from './axios.instance';
import type { PaginatedResponse, PaginationParams } from './students.api';
import type { UserRole, Permission } from './auth.api';

export interface AdminListParams extends PaginationParams {
  role?: UserRole;
  isActive?: boolean;
}

export interface AdminDashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  totalRevenue: number;
  currency: string;
  activeGroups: number;
  pendingPayments: number;
  overduePayments: number;
  attendanceRate: number;
  todayAttendanceRate: number;
  newStudentsThisMonth: number;
  revenueChangePercent: number;
  recentActivities: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    actorName: string | null;
  }>;
}

export interface StaffMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface CreateStaffDto {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions?: Permission[];
  password?: string;
}

export interface UpdateStaffDto {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  permissions?: Permission[];
  isActive?: boolean;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  teacherId?: string;
  teacherName?: string;
  studentCount: number;
  courseCount: number;
  tenantId: string;
  createdAt: string;
}

export interface CreateGroupDto {
  name: string;
  description?: string;
  teacherId?: string;
}

export interface UpdateGroupDto {
  name?: string;
  description?: string;
  teacherId?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AdminAnalyticsData {
  revenue: {
    total: number;
    monthly: number;
    currency: string;
    trend: Array<{ month: string; amount: number }>;
  };
  students: {
    total: number;
    active: number;
    new: number;
  };
  attendance: {
    rate: number;
    trend: Array<{ date: string; rate: number }>;
  };
}

export interface OperationalReport {
  type: 'operational';
  period: { from: string; to: string };
  newEnrollments: number;
  attendanceRate: number;
  homeworkGradedRate: number;
  avgExamScore: number;
  totalRevenue: number;
}

export interface AttendanceReport {
  type: 'attendance';
  total: number;
  present: number;
  rate: number;
  from: string;
  to: string;
}

export interface DebtReportItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  debtAmount: number;
  studentCode: string;
  overduePayments: number;
}

export interface DebtReport {
  type: 'debt';
  totalDebt: number;
  currency: string;
  debtors: number;
  items: DebtReportItem[];
}

export interface PaymentsReportRow {
  status: string;
  count: string;
  total: string;
}

export interface PaymentsReport {
  type: 'payments';
  from: string;
  to: string;
  byStatus: PaymentsReportRow[];
}

export const adminApi = {
  getDashboard: async (): Promise<AdminDashboardStats> => {
    const { data } = await httpClient.get<AdminDashboardStats>(
      '/admin/dashboard',
    );
    return data;
  },

  getStaff: async (
    params: AdminListParams,
  ): Promise<PaginatedResponse<StaffMember>> => {
    const { data } = await httpClient.get<PaginatedResponse<StaffMember>>(
      '/admin/staff',
      { params },
    );
    return data;
  },

  getStaffById: async (id: string): Promise<StaffMember> => {
    const { data } = await httpClient.get<StaffMember>(`/admin/staff/${id}`);
    return data;
  },

  createStaff: async (dto: CreateStaffDto): Promise<StaffMember> => {
    const { data } = await httpClient.post<StaffMember>('/admin/staff', dto);
    return data;
  },

  updateStaff: async (id: string, dto: UpdateStaffDto): Promise<StaffMember> => {
    const { data } = await httpClient.patch<StaffMember>(
      `/admin/staff/${id}`,
      dto,
    );
    return data;
  },

  deleteStaff: async (id: string): Promise<void> => {
    await httpClient.delete(`/admin/staff/${id}`);
  },

  getGroups: async (
    params: PaginationParams,
  ): Promise<PaginatedResponse<Group>> => {
    const { data } = await httpClient.get<PaginatedResponse<Group>>(
      '/admin/groups',
      { params },
    );
    return data;
  },

  getGroupById: async (id: string): Promise<Group> => {
    const { data } = await httpClient.get<Group>(`/admin/groups/${id}`);
    return data;
  },

  createGroup: async (dto: CreateGroupDto): Promise<Group> => {
    const { data } = await httpClient.post<Group>('/admin/groups', dto);
    return data;
  },

  updateGroup: async (id: string, dto: UpdateGroupDto): Promise<Group> => {
    const { data } = await httpClient.patch<Group>(
      `/admin/groups/${id}`,
      dto,
    );
    return data;
  },

  deleteGroup: async (id: string): Promise<void> => {
    await httpClient.delete(`/admin/groups/${id}`);
  },

  getAuditLogs: async (
    params: PaginationParams & { userId?: string; resource?: string },
  ): Promise<PaginatedResponse<AuditLog>> => {
    const { data } = await httpClient.get<PaginatedResponse<AuditLog>>(
      '/admin/audit-logs',
      { params },
    );
    return data;
  },

  getAnalytics: async (params?: {
    from?: string;
    to?: string;
  }): Promise<AdminAnalyticsData> => {
    const { data } = await httpClient.get<AdminAnalyticsData>(
      '/admin/analytics',
      { params },
    );
    return data;
  },

  sendBroadcast: async (
    payload: {
      title: string;
      body: string;
      targetRole?: UserRole;
      targetIds?: string[];
    },
  ): Promise<{ sent: number }> => {
    const { data } = await httpClient.post<{ sent: number }>(
      '/admin/broadcast',
      payload,
    );
    return data;
  },

  resetUserPassword: async (
    userId: string,
  ): Promise<{ temporaryPassword: string }> => {
    const { data } = await httpClient.post<{ temporaryPassword: string }>(
      `/admin/users/${userId}/reset-password`,
    );
    return data;
  },

  getOperationalReport: async (params: {
    from: string;
    to: string;
  }): Promise<OperationalReport> => {
    const { data } = await httpClient.get<OperationalReport>(
      '/admin/reports/operational',
      { params },
    );
    return data;
  },

  getAttendanceReport: async (params: {
    from: string;
    to: string;
  }): Promise<AttendanceReport> => {
    const { data } = await httpClient.get<AttendanceReport>(
      '/admin/reports/attendance',
      { params },
    );
    return data;
  },

  getDebtReport: async (): Promise<DebtReport> => {
    const { data } = await httpClient.get<DebtReport>('/admin/reports/debt');
    return data;
  },

  getPaymentsReport: async (params: {
    from: string;
    to: string;
  }): Promise<PaymentsReport> => {
    const { data } = await httpClient.get<PaymentsReport>(
      '/admin/reports/payments',
      { params },
    );
    return data;
  },
};
