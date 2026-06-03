import type { AttendanceStatus } from '@shared/types/attendance';

export interface StudentFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  avatarKey: string | null;
  languagePreference: 'en' | 'uz' | 'ru';
  themePreference: 'light' | 'dark' | 'system';
}

export interface ChangePasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface StudentListParams {
  page: number;
  pageSize: number;
  search?: string;
  groupId?: string;
  status?: 'active' | 'inactive' | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
  courseId: string;
  courseName: string;
  teacherName: string;
  note?: string;
}

export interface HomeworkSubmissionFormValues {
  homeworkId: string;
  textAnswer: string;
  attachedFileKeys: string[];
}

export interface StudentKpiData {
  coursesEnrolled: number;
  attendanceRate: number;
  homeworkPending: number;
  averageGrade: number;
  coursesEnrolledTrend: number;
  attendanceRateTrend: number;
  homeworkPendingTrend: number;
  averageGradeTrend: number;
}

export interface UpcomingClass {
  id: string;
  courseName: string;
  courseId: string;
  teacherName: string;
  room: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number;
}

export interface ActivityFeedItem {
  id: string;
  type: 'homework_graded' | 'attendance_marked' | 'exam_scheduled' | 'certificate_issued' | 'course_enrolled';
  title: string;
  description: string;
  timestamp: string;
  relatedId?: string;
  metadata?: Record<string, string | number | boolean>;
}

// ─── Backend DTO (mirrors API response shape) ───────────────────────────────
export interface StudentDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  avatarKey: string | null;
  avatarUrl: string | null;
  status: 'active' | 'inactive';
  role: 'student';
  languagePreference: 'en' | 'uz' | 'ru';
  themePreference: 'light' | 'dark' | 'system';
  enrollments: Array<{
    courseId: string;
    courseName: string;
    enrolledAt: string;
    status: 'active' | 'completed' | 'dropped';
  }>;
  createdAt: string;
  updatedAt: string;
}