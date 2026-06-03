'use client';

import { useState } from 'react';
import { InvoiceDto, PaymentStatus } from '../types/payment.types';
import { PaymentStatusBadge } from './PaymentStatusBadge';
import { MultiCurrencyDisplay } from './MultiCurrencyDisplay';
import { mapInvoiceDtoToDisplay } from '../utils/payment.mapper';

const STATUS_FILTERS: { label: string; value: PaymentStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Overdue', value: 'overdue' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Cancelled', value: 'cancelled' },
];

interface InvoiceListProps {
  invoices: InvoiceDto[];
  canManage: boolean;
  onMarkPaid: (id: string) => void;
  onCreateInvoice: () => void;
  onViewDetail: (id: string) => void;
  onExport: () => void;
  isLoading?: boolean;
}

export function InvoiceList({
  invoices,
  canManage,
  onMarkPaid,
  onCreateInvoice,
  onViewDetail,
  onExport,
  isLoading = false,
}: InvoiceListProps) {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = invoices.filter((inv) => {
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchSearch =
      !search ||
      inv.studentName.toLowerCase().includes(search.toLowerCase()) ||
      inv.courseName.toLowerCase().includes(search.toLowerCase());
    const matchFrom = !dateFrom || inv.dueDate >= dateFrom;
    const matchTo = !dateTo || inv.dueDate <= dateTo;
    return matchStatus && matchSearch && matchFrom && matchTo;
  });

  const displayItems = filtered.map(mapInvoiceDtoToDisplay);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search student or course…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-56"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="From date"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="To date"
          />
        </div>
        <div className="ml-auto flex gap-2">
          {canManage && (
            <button
              onClick={onCreateInvoice}
              className="h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              type="button"
            >
              + Create Invoice
            </button>
          )}
          <button
            onClick={onExport}
            className="h-9 rounded-lg border border-border px-4 text-sm font-medium text-foreground hover:bg-muted"
            type="button"
          >
            Export
          </button>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border bg-muted p-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={[
              'shrink-0 rounded-md px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === f.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
            type="button"
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden rounded-xl border border-border md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {['Student', 'Course', 'Amount', 'Due Date', 'Status', 'Actions'].map(
                (col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {col}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 animate-pulse rounded bg-muted" />
                    </td>
                  ))}
                </tr>
              ))
            ) : displayItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                  No invoices found
                </td>
              </tr>
            ) : (
              displayItems.map((item) => (
                <tr key={item.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {item.studentName}
                    <span className="block text-xs text-muted-foreground">
                      {item.studentEmail}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{item.courseName}</td>
                  <td className="px-4 py-3">
                    <MultiCurrencyDisplay amount={parseFloat(item.amount)} currency={item.currency} />
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {item.dueDate}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => onViewDetail(item.id)}
                        className="text-xs text-primary hover:underline"
                        type="button"
                      >
                        View
                      </button>
                      {canManage && item.status === 'pending' && (
                        <button
                          onClick={() => onMarkPaid(item.id)}
                          className="text-xs text-green-600 hover:underline dark:text-green-400"
                          type="button"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {displayItems.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-border bg-card p-4"
          >
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="font-medium text-foreground">{item.studentName}</p>
                <p className="text-xs text-muted-foreground">{item.courseName}</p>
              </div>
              <PaymentStatusBadge status={item.status} size="sm" />
            </div>
            <div className="flex items-center justify-between">
              <MultiCurrencyDisplay amount={parseFloat(item.amount)} currency={item.currency} />
              <div className="flex gap-3">
                <button
                  onClick={() => onViewDetail(item.id)}
                  className="text-xs text-primary"
                  type="button"
                >
                  View
                </button>
                {canManage && item.status === 'pending' && (
                  <button
                    onClick={() => onMarkPaid(item.id)}
                    className="text-xs text-green-600"
                    type="button"
                  >
                    Mark Paid
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Due: {item.dueDate}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
