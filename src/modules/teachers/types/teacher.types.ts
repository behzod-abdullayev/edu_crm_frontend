import type { AttendanceStatus } from '@shared/types/attendance';

export interface TeacherFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  qualifications: string;
  avatarKey: string | null;
  languagePreference: 'en' | 'uz' | 'ru';
  themePreference: 'light' | 'dark' | 'system';
}

export interface TeacherListParams {
  page: number;
  pageSize: number;
  search?: string | undefined;
  status?: 'active' | 'inactive' | 'all' | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | undefined;
}

export interface AttendanceMarkEntry {
  studentId: string;
  studentName: string;
  avatarUrl?: string | undefined;
  status: AttendanceStatus;
  note?: string | undefined;
}

export interface AttendanceMarkingFormValues {
  groupId: string;
  date: string;
  entries: AttendanceMarkEntry[];
}

export interface HomeworkCreateFormValues {
  title: string;
  description: string;
  groupId: string;
  dueDate: string;
  maxPoints: number;
  allowResubmit: boolean;
  attachedFileKeys: string[];
}

export interface HomeworkGradeFormValues {
  grade: number;
  feedback: string;
}

export interface LessonUploadFormValues {
  title: string;
  description: string;
  groupId: string;
  videoUrl?: string | undefined;
  fileKey?: string | undefined;
}

export interface ExamCreateFormValues {
  title: string;
  groupId: string;
  scheduledAt: string;
  durationMinutes: number;
  questionSetId: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string | undefined;
  content: string;
  sentAt: string;
  readAt?: string | undefined;
  isOptimistic?: boolean | undefined;
}

export interface ChatConversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatarUrl?: string | undefined;
  lastMessage?: string | undefined;
  lastMessageAt?: string | undefined;
  unreadCount: number;
}

// ─── Teacher dashboard KPIs ──────────────────────────────────────────────────
// Mirrors the subset of `TeacherAnalyticsDto` (backend `/teachers/:id/analytics`)
// consumed by the dashboard KPI cards.
export interface TeacherDashboardKpi {
  totalGroups: number;
  totalStudents: number;
  avgAttendanceRate: number;
  homeworkStats: {
    assigned: number;
    graded: number;
    pending: number;
  };
}

// ─── Backend DTO (mirrors API response shape) ───────────────────────────────
export interface TeacherDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  bio: string | null;
  qualifications: string | null;
  avatarKey: string | null;
  avatarUrl: string | null;
  status: 'active' | 'inactive';
  role: 'teacher';
  languagePreference: 'en' | 'uz' | 'ru';
  themePreference: 'light' | 'dark' | 'system';
  groups: Array<{
    id: string;
    name: string;
    courseId: string;
    courseName: string;
    studentCount: number;
  }>;
  createdAt: string;
  updatedAt: string;
}