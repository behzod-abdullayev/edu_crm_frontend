'use client';

import { useRouter } from 'next/navigation';
import { usePayments } from '@/modules/payments/hooks/usePayments';
import { PaymentOverview } from '@/modules/payments/components/PaymentOverview';
import { InvoiceList } from '@/modules/payments/components/InvoiceList';
import { DebtCalculator } from '@/modules/payments/components/DebtCalculator';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { can } from '@/lib/permissions';

export function AdminPaymentsClient() {
  const { user } = useAuth();
  const router = useRouter();
  const {
    overview,
    invoices,
    debts,
    isLoading,
    isOffline,
    markPaid,
    createInvoice,
    sendReminder,
  } = usePayments();

  if (!can(user, 'payment.view')) {
    return (
      <div className="flex min-h-96 items-center justify-center">
        <p className="text-muted-foreground">You do not have permission to view payments.</p>
      </div>
    );
  }

  const handleExport = () => {
    const headers = ['Student', 'Course', 'Amount', 'Status', 'Due Date'];
    const rows = invoices.map((inv) =>
      [inv.studentName, inv.courseName, inv.amount, inv.status, inv.dueDate].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-sm text-muted-foreground">Invoices, revenue, and debt tracking</p>
      </div>

      {overview ? (
        <PaymentOverview data={overview} isOffline={isOffline} />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      )}

      <InvoiceList
        invoices={invoices}
        canManage={can(user, 'payment.manage')}
        onMarkPaid={markPaid}
        onCreateInvoice={() => {}}
        onViewDetail={(id) => router.push(`/admin/payments/${id}`)}
        onExport={handleExport}
        isLoading={isLoading}
      />

      {debts.length > 0 && (
        <DebtCalculator
          debts={debts}
          onSendReminder={async (studentId) => {
            const inv = invoices.find((i) => i.studentId === studentId && i.status === 'overdue');
            if (inv) await sendReminder(inv.id);
          }}
        />
      )}
    </div>
  );
}
