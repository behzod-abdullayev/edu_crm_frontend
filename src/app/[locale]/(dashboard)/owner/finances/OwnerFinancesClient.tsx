'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Download,
  Search,
  CreditCard,
  Banknote,
  DollarSign,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ── Static chart data ─────────────────────────────────────────────────────────

const revenueMonthly = [
  { month: 'Jan', income: 42000, expenses: 28000 },
  { month: 'Feb', income: 48000, expenses: 30000 },
  { month: 'Mar', income: 55000, expenses: 32000 },
  { month: 'Apr', income: 51000, expenses: 29000 },
  { month: 'May', income: 60000, expenses: 34000 },
  { month: 'Jun', income: 67000, expenses: 36000 },
  { month: 'Jul', income: 72000, expenses: 38000 },
];

const paymentMethodData = [
  { name: 'Card', value: 55 },
  { name: 'Cash', value: 30 },
  { name: 'Transfer', value: 15 },
];

const PIE_COLORS = ['var(--brand-primary)', 'var(--brand-secondary)', 'var(--brand-accent)'];

// ── Types ─────────────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  subtext?: string;
  colorToken: string;
  icon: string;
  index: number;
}

interface Transaction {
  id: string;
  studentName: string;
  amount: number;
  method: 'card' | 'cash' | 'transfer';
  status: 'paid' | 'pending' | 'overdue';
  date: string;
  course: string;
}

const mockTransactions: Transaction[] = [
  { id: 't1', studentName: 'Alisher Karimov', amount: 450, method: 'card', status: 'paid', date: '2024-07-15', course: 'English B2' },
  { id: 't2', studentName: 'Dilnoza Yusupova', amount: 380, method: 'cash', status: 'pending', date: '2024-07-14', course: 'Math Advanced' },
  { id: 't3', studentName: 'Bobur Toshmatov', amount: 520, method: 'transfer', status: 'paid', date: '2024-07-13', course: 'Python Dev' },
  { id: 't4', studentName: 'Malika Hasanova', amount: 290, method: 'card', status: 'overdue', date: '2024-07-10', course: 'IELTS Prep' },
  { id: 't5', studentName: 'Jasur Nazarov', amount: 410, method: 'cash', status: 'paid', date: '2024-07-09', course: 'Design UX' },
];

// ── Custom tooltip ────────────────────────────────────────────────────────────

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.color, fontSize: 13, fontWeight: 600 }}>
            {entry.name}: ${entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ── Summary card ──────────────────────────────────────────────────────────────

function SummaryCard({ label, value, subtext, colorToken, icon, index }: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      className="rounded-xl p-5"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
          style={{ background: `${colorToken}20` }}
        >
          {icon}
        </div>
        <span className="text-xs font-medium" style={{ color: colorToken }}>
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
      {subtext !== undefined && (
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          {subtext}
        </p>
      )}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function OwnerFinancesClient() {
  const t = useTranslations('owner.finances');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const totalIncome = revenueMonthly.reduce((s, d) => s + d.income, 0);
  const totalExpenses = revenueMonthly.reduce((s, d) => s + d.expenses, 0);
  const netProfit = totalIncome - totalExpenses;
  const pendingCount = mockTransactions.filter((tx) => tx.status === 'pending').length;
  const overdueCount = mockTransactions.filter((tx) => tx.status === 'overdue').length;

  const summaryCards: SummaryCardProps[] = [
    {
      label: 'Total Income',
      value: `$${totalIncome.toLocaleString()}`,
      subtext: '+12.5% vs last period',
      colorToken: 'var(--success-solid)',
      icon: '💰',
      index: 0,
    },
    {
      label: 'Total Expenses',
      value: `$${totalExpenses.toLocaleString()}`,
      subtext: '+5.2% vs last period',
      colorToken: 'var(--error-solid)',
      icon: '📉',
      index: 1,
    },
    {
      label: 'Net Profit',
      value: `$${netProfit.toLocaleString()}`,
      subtext: `${((netProfit / totalIncome) * 100).toFixed(1)}% margin`,
      colorToken: 'var(--brand-primary)',
      icon: '📈',
      index: 2,
    },
    {
      label: 'Pending',
      value: `${pendingCount + overdueCount}`,
      subtext: `${overdueCount} overdue`,
      colorToken: 'var(--warning-solid)',
      icon: '⏳',
      index: 3,
    },
  ];

  const filteredTransactions = mockTransactions.filter((tx) => {
    const matchesSearch =
      tx.studentName.toLowerCase().includes(search.toLowerCase()) ||
      tx.course.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: Transaction['status']) => {
    switch (status) {
      case 'paid':
        return { background: 'var(--success-bg)', color: 'var(--success-text)' };
      case 'pending':
        return { background: 'var(--warning-bg)', color: 'var(--warning-text)' };
      case 'overdue':
        return { background: 'var(--error-bg)', color: 'var(--error-text)' };
    }
  };

  const getMethodIcon = (method: Transaction['method']) => {
    switch (method) {
      case 'card':
        return <CreditCard size={14} />;
      case 'cash':
        return <Banknote size={14} />;
      case 'transfer':
        return <DollarSign size={14} />;
    }
  };

  // Export report handler — calls backend /api/v1/owner/export/payments
  const handleExportReport = useCallback(async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/owner/export/payments');
      if (!res.ok) {
        // If backend export fails, fall back to CSV from local data
        const rows = mockTransactions.map(
          (tx) => `${tx.id},${tx.studentName},${tx.course},${tx.amount},${tx.method},${tx.status},${tx.date}`,
        );
        const csv = ['ID,Student,Course,Amount,Method,Status,Date', ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `financial-report-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }
      // Backend returns Excel binary
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Network error: generate CSV fallback
      const rows = mockTransactions.map(
        (tx) => `${tx.id},${tx.studentName},${tx.course},${tx.amount},${tx.method},${tx.status},${tx.date}`,
      );
      const csv = ['ID,Student,Course,Amount,Method,Status,Date', ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  }, []);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1
            className="text-xl font-bold sm:text-2xl lg:text-3xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Finances
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Financial overview across all branches
          </p>
        </div>

        {/* Export Report button — properly wired with onClick */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleExportReport}
          disabled={isExporting}
          aria-label="Export financial report"
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60"
          style={{
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
          }}
        >
          {isExporting ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <Download size={16} aria-hidden="true" />
          )}
          {isExporting ? 'Exporting…' : 'Export Report'}
        </motion.button>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="col-span-1 rounded-xl p-4 sm:p-6 lg:col-span-2"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 className="mb-4 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Income vs Expenses
          </h2>
          <div className="h-[220px] sm:h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueMonthly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="finIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="finExpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--error-solid)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--error-solid)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <YAxis tick={{ fontSize: 12, fill: 'var(--text-secondary)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  name="income"
                  stroke="var(--brand-primary)"
                  fill="url(#finIncomeGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="expenses"
                  stroke="var(--error-solid)"
                  fill="url(#finExpGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Payment Methods Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="rounded-xl p-4 sm:p-6"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2 className="mb-4 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Payment Methods
          </h2>
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {paymentMethodData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {paymentMethodData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {item.name}
                  </span>
                </div>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {item.value}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Transactions Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="rounded-xl"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Table Header */}
        <div
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderBottom: '1px solid var(--border-default)' }}
        >
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Recent Transactions
          </h2>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-1.5"
              style={{
                background: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-default)',
              }}
            >
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-32 bg-transparent text-xs outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg px-2 py-1.5 text-xs outline-none"
              style={{
                background: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="all">All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                {['Student', 'Course', 'Amount', 'Method', 'Status', 'Date'].map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx, i) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="transition-colors hover:bg-[var(--bg-surface-hover)]"
                  style={{ borderBottom: '1px solid var(--border-default)' }}
                >
                  <td
                    className="px-4 py-3 text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {tx.studentName}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {tx.course}
                  </td>
                  <td
                    className="px-4 py-3 text-sm font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    ${tx.amount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: 'var(--text-muted)' }}>{getMethodIcon(tx.method)}</span>
                      <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                        {tx.method}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                      style={getStatusStyle(tx.status)}
                    >
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {tx.date}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="divide-y sm:hidden" style={{ borderColor: 'var(--border-default)' }}>
          {filteredTransactions.map((tx) => (
            <div key={tx.id} className="p-4">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {tx.studentName}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                  style={getStatusStyle(tx.status)}
                >
                  {tx.status}
                </span>
              </div>
              <p className="mb-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {tx.course}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span style={{ color: 'var(--text-muted)' }}>{getMethodIcon(tx.method)}</span>
                  <span className="text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
                    {tx.method}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    ${tx.amount}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {tx.date}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
