'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys.factory';
import {
  paymentsApi,
  type Payment,
  type PaymentListParams,
  type CreatePaymentDto,
  type UpdatePaymentDto,
} from '@/services/api/payments.api';
import { useUIStore } from '@/store/ui.store';
import { parseApiError } from '@/shared/utils/api-error';

const QUERY_DEFAULTS = {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  retry: 2,
  retryDelay: (n: number) => Math.min(1000 * 2 ** n, 30_000),
  refetchOnWindowFocus: false,
  refetchOnMount: true,
} as const;

export function usePaymentList(params: PaymentListParams) {
  return useQuery({
    queryKey: queryKeys.payments.list(params),
    queryFn: () => paymentsApi.getList(params),
    ...QUERY_DEFAULTS,
  });
}

export function usePaymentDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: () => paymentsApi.getById(id),
    enabled: !!id,
    ...QUERY_DEFAULTS,
  });
}

export function usePaymentSummary(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: queryKeys.payments.summary(params),
    queryFn: () => paymentsApi.getSummary(params),
    ...QUERY_DEFAULTS,
  });
}

export function usePaymentDebts() {
  return useQuery({
    queryKey: queryKeys.payments.debts(),
    queryFn: () => paymentsApi.getDebts(),
    ...QUERY_DEFAULTS,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (dto: CreatePaymentDto) => paymentsApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.all });
      addToast({ type: 'success', title: 'payments.createSuccess' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({
        type: 'error',
        title: 'payments.createFailed',
        description: parsed.message,
      });
    },
  });
}

export function useUpdatePayment(id: string) {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (dto: UpdatePaymentDto) => paymentsApi.update(id, dto),
    onMutate: async (dto) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.payments.detail(id) });
      const previous = queryClient.getQueryData<Payment>(
        queryKeys.payments.detail(id),
      );
      if (previous) {
        queryClient.setQueryData<Payment>(queryKeys.payments.detail(id), {
          ...previous,
          ...dto,
        });
      }
      return { previous };
    },
    onError: (error: unknown, _dto, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.payments.detail(id), context.previous);
      }
      const parsed = parseApiError(error);
      addToast({
        type: 'error',
        title: 'payments.updateFailed',
        description: parsed.message,
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<Payment>(queryKeys.payments.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.summary() });
    },
  });
}

export function useMarkPaymentPaid() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: ({ id }: { id: string }) => paymentsApi.markAsPaid(id),
    onSuccess: (updated, { id }) => {
      queryClient.setQueryData<Payment>(queryKeys.payments.detail(id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.summary() });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.debts() });
      addToast({ type: 'success', title: 'payments.markedAsPaid' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({
        type: 'error',
        title: 'payments.markPaidFailed',
        description: parsed.message,
      });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  const addToast = useUIStore((s) => s.addToast);

  return useMutation({
    mutationFn: (id: string) => paymentsApi.delete(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.payments.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.payments.summary() });
      addToast({ type: 'success', title: 'payments.deleteSuccess' });
    },
    onError: (error: unknown) => {
      const parsed = parseApiError(error);
      addToast({
        type: 'error',
        title: 'payments.deleteFailed',
        description: parsed.message,
      });
    },
  });
}
