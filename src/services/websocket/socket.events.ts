// ─── Socket Event Names ───────────────────────────────────────────────────────
// Enum values MUST match the backend Socket.IO event strings exactly.
// The prompt specifies dot-notation (e.g. 'notification.new'), so we use that.

export enum SocketEvent {
  // ── Notifications ──────────────────────────────────────────────────────────
  NOTIFICATION_NEW      = 'notification.new',
  NOTIFICATION_READ     = 'notification.read',
  NOTIFICATION_ALL_READ = 'notification.all_read',

  // ── Chat ───────────────────────────────────────────────────────────────────
  CHAT_MESSAGE = 'chat.message',
  CHAT_TYPING  = 'chat.typing',
  CHAT_READ    = 'chat.read',

  // ── Attendance ─────────────────────────────────────────────────────────────
  ATTENDANCE_UPDATED = 'attendance.updated',

  // ── Homework ───────────────────────────────────────────────────────────────
  HOMEWORK_GRADED    = 'homework.graded',
  HOMEWORK_SUBMITTED = 'homework.submitted',

  // ── Payments ───────────────────────────────────────────────────────────────
  PAYMENT_RECEIVED = 'payment.received',
  PAYMENT_OVERDUE  = 'payment.overdue',

  // ── Schedule ───────────────────────────────────────────────────────────────
  SCHEDULE_UPDATED = 'schedule.updated',

  // ── Exams ──────────────────────────────────────────────────────────────────
  EXAM_STARTED = 'exam.started',
}

// ─── Payload Interfaces ───────────────────────────────────────────────────────

export interface NotificationNewPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationReadPayload {
  id: string;
  readAt: string;
}

export interface NotificationAllReadPayload {
  readAt: string;
}

export interface ChatMessagePayload {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string | undefined;
  body: string;
  attachments?: string[] | undefined;
  createdAt: string;
}

export interface ChatTypingPayload {
  roomId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface ChatReadPayload {
  roomId: string;
  userId: string;
  readAt: string;
}

export interface AttendanceUpdatedPayload {
  studentId: string;
  lessonId: string;
  lessonDate: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

export interface HomeworkGradedPayload {
  studentId: string;
  courseId: string;
  homeworkId: string;
  submissionId: string;
  grade: number;
  maxScore: number;
  feedback?: string | undefined;
  gradedAt: string;
}

export interface HomeworkSubmittedPayload {
  courseId: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  submissionId: string;
  submittedAt: string;
}

export interface PaymentReceivedPayload {
  paymentId: string;
  studentId: string;
  studentName: string;
  amount: number;
  currency: string;
  paidAt: string;
}

export interface PaymentOverduePayload {
  paymentId: string;
  studentId: string;
  studentName: string;
  amount: number;
  currency: string;
  dueDate: string;
}

export interface ScheduleUpdatedPayload {
  courseId: string;
  courseName: string;
  changedBy: string;
  changes: string;
  updatedAt: string;
}

export interface ExamStartedPayload {
  examId: string;
  courseId: string;
  courseName: string;
  title: string;
  durationMinutes: number;
  startedAt: string;
}

// ─── Discriminated Payload Map ────────────────────────────────────────────────
// Maps each SocketEvent to its payload type for type-safe event handling.

export type SocketEventPayloadMap = {
  [SocketEvent.NOTIFICATION_NEW]:      NotificationNewPayload;
  [SocketEvent.NOTIFICATION_READ]:     NotificationReadPayload;
  [SocketEvent.NOTIFICATION_ALL_READ]: NotificationAllReadPayload;
  [SocketEvent.CHAT_MESSAGE]:          ChatMessagePayload;
  [SocketEvent.CHAT_TYPING]:           ChatTypingPayload;
  [SocketEvent.CHAT_READ]:             ChatReadPayload;
  [SocketEvent.ATTENDANCE_UPDATED]:    AttendanceUpdatedPayload;
  [SocketEvent.HOMEWORK_GRADED]:       HomeworkGradedPayload;
  [SocketEvent.HOMEWORK_SUBMITTED]:    HomeworkSubmittedPayload;
  [SocketEvent.PAYMENT_RECEIVED]:      PaymentReceivedPayload;
  [SocketEvent.PAYMENT_OVERDUE]:       PaymentOverduePayload;
  [SocketEvent.SCHEDULE_UPDATED]:      ScheduleUpdatedPayload;
  [SocketEvent.EXAM_STARTED]:          ExamStartedPayload;
};

// ─── Type Helper ─────────────────────────────────────────────────────────────
// Provides a typed handler signature for any socket event.

export type SocketEventHandler<E extends SocketEvent> = (
  payload: SocketEventPayloadMap[E],
) => void;