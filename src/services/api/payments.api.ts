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
  studentName: string;
  courseId?: string;
  courseName?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  description?: string;
  dueDate?: string;
  paidAt?: string;
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

export const paymentsApi = {
  getList: async (
    params: PaymentListParams,
  ): Promise<PaginatedResponse<Payment>> => {
    const { data } = await httpClient.get<PaginatedResponse<Payment>>(
      '/payments',
      { params },
    );
    return data;
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

  markAsPaid: async (id: string, paidAt?: string): Promise<Payment> => {
    const { data } = await httpClient.post<Payment>(`/payments/${id}/mark-paid`, {
      paidAt,
    });
    return data;
  },

  getSummary: async (params?: {
    from?: string;
    to?: string;
  }): Promise<PaymentSummary> => {
    const { data } = await httpClient.get<PaymentSummary>(
      '/payments/summary',
      { params },
    );
    return data;
  },

  getDebts: async (
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Debt>> => {
    const { data } = await httpClient.get<PaginatedResponse<Debt>>(
      '/payments/debts',
      { params },
    );
    return data;
  },

  generateInvoice: async (id: string): Promise<{ invoiceUrl: string }> => {
    const { data } = await httpClient.post<{ invoiceUrl: string }>(
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
