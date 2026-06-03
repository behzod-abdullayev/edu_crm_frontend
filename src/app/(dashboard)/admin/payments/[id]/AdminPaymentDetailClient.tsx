'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { InvoiceDetail } from '@/modules/payments/components/InvoiceDetail';
import { InvoiceDto } from '@/modules/payments/types/payment.types';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { can } from '@/lib/permissions';

interface PageProps {
  params: { id: string };
}

export function AdminPaymentDetailClient({ params }: PageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/payments/invoices/${params.id}`)
      .then((r) => r.json() as Promise<InvoiceDto>)
      .then(setInvoice)
      .finally(() => setIsLoading(false));
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <p className="text-muted-foreground">Invoice not found.</p>
      </div>
    );
  }

  const handleMarkPaid = async () => {
    await fetch(`/api/admin/payments/invoices/${invoice.id}/mark-paid`, { method: 'PATCH' });
    setInvoice((prev) => prev ? { ...prev, status: 'paid', paidAt: new Date().toISOString() } : prev);
  };

  const handleSendReminder = async () => {
    await fetch(`/api/admin/payments/invoices/${invoice.id}/remind`, { method: 'POST' });
  };

  const handleRefund = async () => {
    await fetch(`/api/admin/payments/invoices/${invoice.id}/refund`, { method: 'POST' });
    setInvoice((prev) => prev ? { ...prev, status: 'refunded' } : prev);
  };

  return (
    <div className="p-4 sm:p-6">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        type="button"
      >
        ← Back to Payments
      </button>

      <InvoiceDetail
        invoice={invoice}
        canRefund={can(user, 'payment.refund')}
        onMarkPaid={handleMarkPaid}
        onSendReminder={handleSendReminder}
        onRefund={handleRefund}
      />
    </div>
  );
}
