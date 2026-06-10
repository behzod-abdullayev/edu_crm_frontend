import { useState, useEffect, useCallback } from 'react';
import type { InvoiceDto, PaymentOverviewData, DebtSummary } from '../types/payment.types';

const CACHE_KEY = 'payments_overview_cache';

interface UsePaymentsReturn {
  overview: PaymentOverviewData | null;
  invoices: InvoiceDto[];
  debts: DebtSummary[];
  isLoading: boolean;
  isOffline: boolean;
  error: string | null;
  markPaid: (invoiceId: string) => Promise<void>;
  createInvoice: (data: Partial<InvoiceDto>) => Promise<void>;
  sendReminder: (invoiceId: string) => Promise<void>;
  refundInvoice: (invoiceId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePayments(): UsePaymentsReturn {
  const [overview, setOverview] = useState<PaymentOverviewData | null>(null);
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [debts, setDebts] = useState<DebtSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [overviewRes, invoicesRes, debtsRes] = await Promise.all([
        fetch('/api/admin/payments/overview'),
        fetch('/api/admin/payments/invoices'),
        fetch('/api/admin/payments/debts'),
      ]);

      if (!overviewRes.ok || !invoicesRes.ok || !debtsRes.ok) {
        throw new Error('Failed to fetch payment data');
      }

      const [overviewData, invoicesData, debtsData] = await Promise.all([
        overviewRes.json() as Promise<PaymentOverviewData>,
        invoicesRes.json() as Promise<InvoiceDto[]>,
        debtsRes.json() as Promise<DebtSummary[]>,
      ]);

      setOverview(overviewData);
      setInvoices(invoicesData);
      setDebts(debtsData);
      setIsOffline(false);

      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ overview: overviewData, timestamp: Date.now() })
      );
    } catch {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as {
          overview: PaymentOverviewData;
          timestamp: number;
        };
        setOverview({
          ...parsed.overview,
          lastUpdated: new Date(parsed.timestamp).toISOString(),
        });
        setIsOffline(true);
      } else {
        setError('Unable to load payment data');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const markPaid = useCallback(async (invoiceId: string) => {
    const res = await fetch(`/api/admin/payments/invoices/${invoiceId}/mark-paid`, {
      method: 'PATCH',
    });
    if (!res.ok) throw new Error('Failed to mark invoice as paid');
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId
          ? { ...inv, status: 'paid', paidAt: new Date().toISOString() }
          : inv
      )
    );
  }, []);

  const createInvoice = useCallback(async (data: Partial<InvoiceDto>) => {
    const res = await fetch('/api/admin/payments/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create invoice');
    const created = (await res.json()) as InvoiceDto;
    setInvoices((prev) => [created, ...prev]);
  }, []);

  const sendReminder = useCallback(async (invoiceId: string) => {
    const res = await fetch(`/api/admin/payments/invoices/${invoiceId}/remind`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to send reminder');
  }, []);

  const refundInvoice = useCallback(async (invoiceId: string) => {
    const res = await fetch(`/api/admin/payments/invoices/${invoiceId}/refund`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to process refund');
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: 'refunded' } : inv
      )
    );
  }, []);

  return {
    overview,
    invoices,
    debts,
    isLoading,
    isOffline,
    error,
    markPaid,
    createInvoice,
    sendReminder,
    refundInvoice,
    refresh: fetchData,
  };
}
