import { httpClient } from './axios.instance';
import type { PaginatedResponse, PaginationParams } from './students.api';

export interface PaymentListParams extends PaginationParams {
  studentId?: string;
  status?: PaymentStatus;
  method?: PaymentMethod;
  courseId?: string;
  from?: string;
  to?: string;
}

export type PaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cash' | 'card' | 'bank_transfer' | 'online';

export interface Payment {
  id: string;
  studentId: string;
  studentName?: string;
  courseId?: string;
  courseName?: string;
  amount: number;
  totalAmount?: number;
  discountAmount?: number;
  currency: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  description?: string;
  notes?: string | null;
  dueDate?: string | null;
  paidAt?: string | null;
  invoiceUrl?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentDto {
  studentId: string;
  courseId?: string;
  amount: number;
  currency: string;
  description?: string;
  dueDate?: string;
  method?: PaymentMethod;
}

export interface UpdatePaymentDto {
  status?: PaymentStatus;
  method?: PaymentMethod;
  paidAt?: string;
  description?: string;
}

export interface PaymentSummary {
  totalRevenue: number;
  totalPending: number;
  totalOverdue: number;
  totalRefunded: number;
  currency: string;
  monthlyRevenue: Array<{ month: string; amount: number }>;
}

export interface Debt {
  studentId: string;
  studentName: string;
  totalDebt: number;
  currency: string;
  overdueCount: number;
  payments: Payment[];
}

/** Raw paginated envelope returned by the backend (`{ data, meta: { total, page, limit, totalPages } }`). */
interface RawPaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

/** Raw row shape returned by GET /payments/report/revenue (DATE_TRUNC SQL aggregate). */
interface RevenueReportRow {
  month: string;
  revenue: string;
  count: string;
}

/** Raw row shape returned by GET /payments/report/debtors (joined SQL aggregate). */
interface DebtorRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  debt_amount: string;
  overdue_count: string;
}

export const paymentsApi = {
  getList: async (
    params: PaymentListParams,
  ): Promise<PaginatedResponse<Payment>> => {
    const { data } = await httpClient.get<RawPaginatedResponse<Payment>>(
      '/payments',
      { params },
    );
    return {
      data: data.data,
      total: data.meta.total,
      page: data.meta.page,
      limit: data.meta.limit,
      totalPages: data.meta.totalPages,
    };
  },

  getById: async (id: string): Promise<Payment> => {
    const { data } = await httpClient.get<Payment>(`/payments/${id}`);
    return data;
  },

  create: async (dto: CreatePaymentDto): Promise<Payment> => {
    const { data } = await httpClient.post<Payment>('/payments', dto);
    return data;
  },

  update: async (id: string, dto: UpdatePaymentDto): Promise<Payment> => {
    const { data } = await httpClient.patch<Payment>(`/payments/${id}`, dto);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await httpClient.delete(`/payments/${id}`);
  },

  markAsPaid: async (id: string): Promise<Payment> => {
    await httpClient.post(`/payments/${id}/pay`);
    const { data } = await httpClient.get<Payment>(`/payments/${id}`);
    return data;
  },

  getSummary: async (params?: {
    from?: string;
    to?: string;
  }): Promise<PaymentSummary> => {
    const to = params?.to ?? new Date().toISOString().slice(0, 10);
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - 11);
    fromDate.setDate(1);
    const from = params?.from ?? fromDate.toISOString().slice(0, 10);

    const [{ data: payments }, { data: revenueRows }] = await Promise.all([
      httpClient.get<RawPaginatedResponse<Payment>>('/payments', {
        params: { page: 1, limit: 100 },
      }),
      httpClient.get<RevenueReportRow[]>('/payments/report/revenue', {
        params: { from, to },
      }),
    ]);

    const items = payments.data ?? [];
    const sumByStatus = (status: PaymentStatus) =>
      items
        .filter((p) => p.status === status)
        .reduce((sum, p) => sum + (p.totalAmount ?? p.amount ?? 0), 0);

    return {
      totalRevenue: sumByStatus('paid'),
      totalPending: sumByStatus('pending'),
      totalOverdue: sumByStatus('overdue'),
      totalRefunded: sumByStatus('refunded'),
      currency: items[0]?.currency ?? 'UZS',
      monthlyRevenue: (revenueRows ?? []).map((row) => ({
        month: new Date(row.month).toISOString().slice(0, 7),
        amount: Number(row.revenue),
      })),
    };
  },

  getDebts: async (): Promise<PaginatedResponse<Debt>> => {
    const { data } = await httpClient.get<DebtorRow[]>(
      '/payments/report/debtors',
    );
    const debts: Debt[] = (data ?? []).map((row) => ({
      studentId: row.id,
      studentName: `${row.first_name} ${row.last_name}`.trim(),
      totalDebt: Number(row.debt_amount),
      currency: 'UZS',
      overdueCount: Number(row.overdue_count),
      payments: [],
    }));

    return {
      data: debts,
      total: debts.length,
      page: 1,
      limit: debts.length,
      totalPages: 1,
    };
  },

  generateInvoice: async (id: string): Promise<{ invoiceUrl: string }> => {
    const { data } = await httpClient.get<{ invoiceUrl: string }>(
      `/payments/${id}/invoice`,
    );
    return data;
  },

  bulkCreate: async (dtos: CreatePaymentDto[]): Promise<Payment[]> => {
    const { data } = await httpClient.post<Payment[]>(
      '/payments/bulk',
      dtos,
    );
    return data;
  },
};
