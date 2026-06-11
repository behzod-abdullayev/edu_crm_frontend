'use client';

import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsApi, type Payment, type Debt } from '@/services/api/payments.api';
import { studentsApi } from '@/services/api/students.api';
import { coursesApi } from '@/services/api/courses.api';
import { queryKeys } from '@/services/query/keys.factory';
import type { InvoiceDto, PaymentOverviewData, DebtSummary, Currency } from '../types/payment.types';

interface UsePaymentsReturn {
  overview: PaymentOverviewData | null;
  invoices: InvoiceDto[];
  monthlyRevenue: Array<{ month: string; amount: number }>;
  debts: DebtSummary[];
  isLoading: boolean;
  error: string | null;
  markPaid: (invoiceId: string) => Promise<void>;
  refresh: () => void;
}

const QUERY_OPTS = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function mapPaymentToInvoice(
  payment: Payment,
  studentMap: Map<string, { name: string; email: string }>,
  courseMap: Map<string, string>,
): InvoiceDto {
  const student = studentMap.get(payment.studentId);
  return {
    id: payment.id,
    studentId: payment.studentId,
    studentName: student?.name ?? payment.studentName ?? '',
    studentEmail: student?.email ?? '',
    courseId: payment.courseId ?? '',
    courseName:
      (payment.courseId ? courseMap.get(payment.courseId) : undefined) ??
      payment.courseName ??
      '',
    amount: payment.totalAmount ?? payment.amount,
    currency: (payment.currency as Currency) ?? 'UZS',
    status: payment.status,
    dueDate: payment.dueDate ?? '',
    paidAt: payment.paidAt ?? null,
    description: payment.description ?? payment.notes ?? null,
    discount: payment.discountAmount ?? 0,
    history: [],
    createdAt: payment.createdAt,
  };
}

/**
 * The debtors report only returns the total owed per student. Overdue/upcoming
 * breakdowns and "days overdue" are approximated from the loaded payments page.
 */
function computeDebtSummary(debt: Debt, payments: Payment[]): DebtSummary {
  const now = Date.now();
  let overdueAmount = 0;
  let upcomingDue = 0;
  let daysOverdue = 0;

  for (const p of payments) {
    if (p.studentId !== debt.studentId) continue;
    const amount = p.totalAmount ?? p.amount;
    if (p.status === 'overdue') {
      overdueAmount += amount;
      if (p.dueDate) {
        const days = Math.floor((now - new Date(p.dueDate).getTime()) / MS_PER_DAY);
        if (days > daysOverdue) daysOverdue = days;
      }
    } else if (p.status === 'pending') {
      upcomingDue += amount;
    }
  }

  return {
    studentId: debt.studentId,
    studentName: debt.studentName,
    totalOwed: debt.totalDebt,
    overdueAmount,
    upcomingDue,
    daysOverdue,
    currency: (debt.currency as Currency) ?? 'UZS',
  };
}

export function usePayments(): UsePaymentsReturn {
  const queryClient = useQueryClient();

  const paymentsQuery = useQuery({
    queryKey: queryKeys.payments.list({ page: 1, limit: 100 }),
    queryFn: () => paymentsApi.getList({ page: 1, limit: 100 }),
    ...QUERY_OPTS,
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.payments.summary(),
    queryFn: () => paymentsApi.getSummary(),
    ...QUERY_OPTS,
  });

  const debtsQuery = useQuery({
    queryKey: queryKeys.payments.debts(),
    queryFn: () => paymentsApi.getDebts(),
    ...QUERY_OPTS,
  });

  const studentsQuery = useQuery({
    queryKey: queryKeys.students.list({ page: 1, limit: 100 }),
    queryFn: () => studentsApi.getList({ page: 1, limit: 100 }),
    ...QUERY_OPTS,
  });

  const coursesQuery = useQuery({
    queryKey: queryKeys.courses.list({ page: 1, limit: 100 }),
    queryFn: () => coursesApi.getList({ page: 1, limit: 100 }),
    ...QUERY_OPTS,
  });

  const studentMap = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();
    for (const s of studentsQuery.data?.data ?? []) {
      map.set(s.id, { name: `${s.firstName} ${s.lastName}`.trim(), email: s.email });
    }
    return map;
  }, [studentsQuery.data]);

  const courseMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of coursesQuery.data?.data ?? []) {
      map.set(c.id, c.name);
    }
    return map;
  }, [coursesQuery.data]);

  const payments = useMemo(() => paymentsQuery.data?.data ?? [], [paymentsQuery.data]);

  const invoices = useMemo(
    () => payments.map((p) => mapPaymentToInvoice(p, studentMap, courseMap)),
    [payments, studentMap, courseMap],
  );

  const overview: PaymentOverviewData | null = summaryQuery.data
    ? {
        totalRevenue: summaryQuery.data.totalRevenue,
        totalPending: summaryQuery.data.totalPending,
        totalOverdue: summaryQuery.data.totalOverdue,
        totalRefunded: summaryQuery.data.totalRefunded,
        currency: (summaryQuery.data.currency as Currency) ?? 'UZS',
        lastUpdated: new Date().toISOString(),
      }
    : null;

  const monthlyRevenue = summaryQuery.data?.monthlyRevenue ?? [];

  const debts = useMemo(
    () => (debtsQuery.data?.data ?? []).map((d) => computeDebtSummary(d, payments)),
    [debtsQuery.data, payments],
  );

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.markAsPaid(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });

  const markPaid = useCallback(
    async (invoiceId: string) => {
      await markPaidMutation.mutateAsync(invoiceId);
    },
    [markPaidMutation],
  );

  const refresh = useCallback(() => {
    void paymentsQuery.refetch();
    void summaryQuery.refetch();
    void debtsQuery.refetch();
    void studentsQuery.refetch();
    void coursesQuery.refetch();
  }, [paymentsQuery, summaryQuery, debtsQuery, studentsQuery, coursesQuery]);

  const queries = [paymentsQuery, summaryQuery, debtsQuery, studentsQuery, coursesQuery];
  const isLoading = queries.some((q) => q.isLoading);
  const firstError = queries.find((q) => q.error)?.error;
  const error = firstError
    ? firstError instanceof Error
      ? firstError.message
      : 'Failed to load payment data'
    : null;

  return {
    overview,
    invoices,
    monthlyRevenue,
    debts,
    isLoading,
    error,
    markPaid,
    refresh,
  };
}
