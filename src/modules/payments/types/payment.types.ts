export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'refunded' | 'cancelled';

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'online';

export type Currency = 'UZS' | 'USD' | 'EUR' | 'RUB';

export interface PaymentFormValues {
  studentId: string;
  courseId: string;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  dueDate: string;
  notes?: string;
}

export interface InvoiceFormValues {
  studentId: string;
  courseId: string;
  amount: number;
  currency: Currency;
  dueDate: string;
  description?: string;
  discount?: number;
}

export interface PaymentDto {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  status: PaymentStatus;
  dueDate: string;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceDto {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  dueDate: string;
  paidAt: string | null;
  description: string | null;
  discount: number;
  history: PaymentHistoryEntry[];
  createdAt: string;
}

export interface PaymentHistoryEntry {
  id: string;
  action: string;
  performedBy: string;
  performedAt: string;
  note: string | null;
}

export interface PaymentOverviewData {
  totalRevenue: number;
  totalPending: number;
  totalOverdue: number;
  totalRefunded: number;
  currency: Currency;
  lastUpdated: string;
}

export interface DebtSummary {
  studentId: string;
  studentName: string;
  totalOwed: number;
  overdueAmount: number;
  upcomingDue: number;
  daysOverdue: number;
  currency: Currency;
}

export interface PaymentDisplayItem {
  id: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  amount: string;
  currency: Currency;
  status: PaymentStatus;
  dueDate: string;
  paidAt: string | null;
}
