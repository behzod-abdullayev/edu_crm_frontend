export interface AdminDashboardData {
  totalStudents: number;
  totalTeachers: number;
  totalCourses: number;
  monthlyRevenue: number;
  newEnrollments: number;
  pendingPayments: number;
  revenueHistory: ChartDataPoint[];
  enrollmentHistory: ChartDataPoint[];
  attendanceByGroup: GroupAttendance[];
  debtBreakdown: DebtBreakdown;
  recentActivity: ActivityItem[];
  trends: DashboardTrends;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface GroupAttendance {
  groupName: string;
  attendancePercent: number;
}

export interface DebtBreakdown {
  paid: number;
  pending: number;
  overdue: number;
}

export interface DashboardTrends {
  studentsChange: number;
  teachersChange: number;
  revenueChange: number;
  enrollmentChange: number;
}

export interface ActivityItem {
  id: string;
  type: 'payment' | 'enrollment' | 'event';
  description: string;
  actor: string;
  timestamp: string;
}

export interface CourseDto {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  studentsEnrolled: number;
  price: number;
  currency: string;
  status: CourseStatus;
  startDate: string;
  endDate: string | null;
  createdAt: string;
}

export type CourseStatus = 'active' | 'draft' | 'archived' | 'completed';

export interface TeacherDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  groupsAssigned: number;
  joinedDate: string;
  status: 'active' | 'inactive';
  branchId: string;
}

export interface StudentDto {
  id: string;
  name: string;
  email: string;
  phone: string;
  courses: string[];
  attendancePercent: number;
  balance: number;
  currency: string;
  status: 'active' | 'inactive';
  paymentStatus: 'paid' | 'pending' | 'overdue';
}

export interface ScheduleEvent {
  id: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  room: string;
  startTime: string;
  endTime: string;
  repeatRule: RepeatRule | null;
  color?: string;
}

export type RepeatRule = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface ScheduleEventForm {
  courseId: string;
  teacherId: string;
  room: string;
  startTime: string;
  endTime: string;
  repeatRule: RepeatRule | null;
}

export type ReportType = 'attendance' | 'financial' | 'performance';

export interface TenantConfig {
  academyName: string;
  logoUrl: string | null;
  timezone: string;
  currency: string;
  primaryColor: string;
  features: FeatureFlags;
}

export interface FeatureFlags {
  payments: boolean;
  chat: boolean;
  certificates: boolean;
  exams: boolean;
}

export interface PricingEntry {
  id: string;
  courseId: string;
  courseName: string;
  price: number;
  currency: string;
}
