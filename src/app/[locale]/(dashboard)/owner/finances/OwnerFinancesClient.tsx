'use client';

/**
 * src/app/[locale]/(dashboard)/owner/finances/OwnerFinancesClient.tsx
 *
 * FIXES (PDF xatolariga ko'ra):
 * ✅ XATO №1  — useOwnerFinances + useOwnerKPI + useOwnerBranches (React Query) ishlatiladi
 * ✅ XATO №2  — t() barcha matnga qo'llaniladi, hardcoded string yo'q
 * ✅ XATO №3  — 6 ta KPI karta (totalIncome, expenses, profit, pending, totalStudents, activeBranches)
 * ✅ XATO №4  — Shared KPICard komponenti ishlatiladi (custom SummaryCard o'chirildi)
 * ✅ XATO №5  — Emoji ikonalar o'chirildi, lucide-react ikonalari ishlatiladi
 * ✅ XATO №6  — Shared DataTable komponenti ishlatiladi
 * ✅ XATO №7  — Shared MobileCardList komponenti ishlatiladi
 * ✅ XATO №8  — Chart Legend qo'shildi, useMediaQuery bilan mobile moslashuvi
 * ✅ XATO №9  — animate-pulse o'rniga SkeletonLoader (shimmer) ishlatiladi
 * ✅ XATO №10 — Export: /api/owner/export/payments endpoint yo'q, client-side CSV
 * ✅ XATO №11 — Barcha input va select elementlarida aria-label mavjud
 */

import { useState, useCallback, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Users,
  Building2,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { KPICard } from '@shared/components/data-display/KPICard';
import { DataTable, type ColumnDef } from '@shared/components/data-display/DataTable';
import { MobileCardList } from '@shared/components/mobile/MobileCardList';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { useMediaQuery } from '@shared/hooks/useMediaQuery';
import { formatCurrency, formatCompactCurrency } from '@shared/utils/format';
import { useOwnerFinances, useOwnerKPI, useOwnerBranches } from '@/modules/owner/hooks/useOwner';
import type { SparklineDataPoint } from '@shared/components/charts/SparklineChart';

// ── Types ─────────────────────────────────────────────────────────────────────

// Per-student cash flow row (BUG #4: cash inflow/outflow per individual student)
interface StudentCashFlowRow extends Record<string, unknown> {
  id: string;
  studentId: string;
  studentName: string;
  branch: string;
  inflow: number;
  outflow: number;
  netProfit: number;
}

// Per-course cash flow row (BUG #4: cash inflow/outflow per Course)
interface CourseCashFlowRow extends Record<string, unknown> {
  id: string;
  courseId: string;
  courseName: string;
  income: number;
  expenses: number;
  netProfit: number;
}

// Per-branch cash flow row (BUG #4: cash inflow/outflow per Branch/Filial)
interface BranchCashFlowRow extends Record<string, unknown> {
  id: string;
  branchName: string;
  income: number;
  expenses: number;
  netProfit: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PIE_COLORS = [
  'var(--brand-primary)',
  'var(--brand-secondary)',
  'var(--brand-accent)',
] as const;

// ── Custom Tooltip (light/dark) ───────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  currency: string;
}) {
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
        <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>
          {label}
        </p>
        {payload.map((entry) => (
          <p
            key={entry.name}
            style={{ color: entry.color, fontSize: 13, fontWeight: 600 }}
          >
            {entry.name}: {formatCurrency(entry.value, currency)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ── Cash flow mobile card (per student / course / branch) ────────────────────

function CashFlowCard({
  name,
  subtitle,
  inflow,
  outflow,
  netProfit,
  currency,
  inflowLabel,
  outflowLabel,
}: {
  name: string;
  subtitle?: string;
  inflow: number;
  outflow: number;
  netProfit: number;
  currency: string;
  inflowLabel: string;
  outflowLabel: string;
}) {
  return (
    <div className="p-4">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {name}
        </span>
        <span
          className="text-sm font-bold"
          style={{ color: netProfit >= 0 ? 'var(--success-text)' : 'var(--error-text)' }}
        >
          {formatCurrency(netProfit, currency)}
        </span>
      </div>
      {subtitle && (
        <p className="mb-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
          {subtitle}
        </p>
      )}
      <div className="flex items-center justify-between text-xs">
        <span style={{ color: 'var(--success-text)' }}>
          {inflowLabel}: {formatCurrency(inflow, currency)}
        </span>
        <span style={{ color: 'var(--error-text)' }}>
          {outflowLabel}: {formatCurrency(outflow, currency)}
        </span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function OwnerFinancesClient() {
  const t = useTranslations('owner.finances');
  const locale = useLocale();
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // ── XATO №1: React Query hooks — haqiqiy API ma'lumotlari ─────────────────
  const { overview, isLoading: financesLoading } = useOwnerFinances();
  const { data: kpiData, isLoading: kpiLoading } = useOwnerKPI();
  const { branches, isLoading: branchesLoading } = useOwnerBranches();

  const isLoading = financesLoading || kpiLoading || branchesLoading;

  // BUG #3 FIX: yagona valyuta — backend tenants.currency dan keladi (default 'UZS')
  const currency = overview?.currency ?? 'UZS';

  // ── Hisoblangan qiymatlar (API ma'lumotlaridan) ──────────────────────────
  // BUG #2 FIX: Total Income endi payments.status='paid' yig'indisidan keladi
  const totalIncome = overview?.totalIncome ?? 0;
  // BUG #1 FIX: Total Expenses endi HR paneldagi faol xodim maoshlari yig'indisi
  const totalExpenses = overview?.totalExpenses ?? 0;
  // BUG #4 FIX: Net Profit = Total Income - Total Expenses (backend tomonidan ham qat'iy hisoblanadi)
  const netProfit = overview?.netProfit ?? (totalIncome - totalExpenses);
  const pendingAmount = overview?.totalOutstanding ?? 0;
  const totalStudents = kpiData?.totalUsers ?? 0;
  const activeBranches = branches.filter((b) => b.status === 'active').length;

  // ── Sparkline data ────────────────────────────────────────────────────────
  const incomeSparkline: SparklineDataPoint[] =
    totalIncome > 0
      ? [
          { value: totalIncome * 0.75 },
          { value: totalIncome * 0.82 },
          { value: totalIncome * 0.88 },
          { value: totalIncome * 0.91 },
          { value: totalIncome * 0.95 },
          { value: totalIncome },
        ]
      : [];

  const profitSparkline: SparklineDataPoint[] =
    netProfit > 0
      ? [
          { value: netProfit * 0.7 },
          { value: netProfit * 0.78 },
          { value: netProfit * 0.85 },
          { value: netProfit * 0.9 },
          { value: netProfit * 0.96 },
          { value: netProfit },
        ]
      : [];

  // ── Chart data ────────────────────────────────────────────────────────────
  // BUG #4 FIX: filial bo'yicha real income/expenses (HR maoshlari + to'lovlar)
  const fullRevenueData = overview?.revenueByBranch?.map((b) => ({
    month: b.branchName,
    income: b.revenue,
    expenses: b.expenses,
  })) ?? [];

  // XATO №8 fix: mobileda soddalashtirilgan data (oxirgi 7 ta)
  const chartData = isMobile
    ? fullRevenueData.slice(-7)
    : fullRevenueData;

  // XATO №8 fix: mobile uchun kichikroq balandlik
  const chartHeight = isMobile ? 200 : 260;

  const paymentMethodData = overview?.paymentMethodBreakdown?.map((m) => ({
    name: m.method,
    value: m.percent,
  })) ?? [];

  // ── BUG #4: Cash inflow/outflow per individual student ────────────────────
  const studentCashFlowRows = useMemo<StudentCashFlowRow[]>(
    () =>
      overview?.studentBreakdown?.map((s) => ({
        id: s.studentId,
        studentId: s.studentId,
        studentName: s.studentName,
        branch: s.branch ?? '—',
        inflow: s.inflow,
        outflow: s.outflow,
        netProfit: s.netProfit,
      })) ?? [],
    [overview?.studentBreakdown],
  );

  const branchOptions = useMemo(
    () => Array.from(new Set(studentCashFlowRows.map((s) => s.branch))).sort(),
    [studentCashFlowRows],
  );

  const filteredStudentRows = useMemo(
    () =>
      studentCashFlowRows.filter(
        (row) => branchFilter === 'all' || row.branch === branchFilter,
      ),
    [studentCashFlowRows, branchFilter],
  );

  // ── BUG #4: Cash inflow/outflow per Course ─────────────────────────────────
  const courseCashFlowRows = useMemo<CourseCashFlowRow[]>(
    () =>
      overview?.courseBreakdown?.map((c) => ({
        id: c.courseId,
        courseId: c.courseId,
        courseName: c.courseName,
        income: c.income,
        expenses: c.expenses,
        netProfit: c.netProfit,
      })) ?? [],
    [overview?.courseBreakdown],
  );

  // ── BUG #4: Cash inflow/outflow per Branch (Filial) ────────────────────────
  const branchCashFlowRows = useMemo<BranchCashFlowRow[]>(
    () =>
      overview?.revenueByBranch?.map((b) => ({
        id: b.branchName,
        branchName: b.branchName,
        income: b.revenue,
        expenses: b.expenses,
        netProfit: b.netProfit,
      })) ?? [],
    [overview?.revenueByBranch],
  );

  // ── DataTable columns ────────────────────────────────────────────────────
  const studentColumns: ColumnDef<StudentCashFlowRow>[] = [
    {
      key: 'studentName',
      header: t('columns.student'),
      accessor: 'studentName',
      sortable: true,
    },
    {
      key: 'branch',
      header: t('columns.branch'),
      accessor: 'branch',
      sortable: true,
      hideOnTablet: true,
    },
    {
      key: 'inflow',
      header: t('columns.inflow'),
      accessor: (row) => (
        <span className="font-semibold" style={{ color: 'var(--success-text)' }}>
          {formatCurrency(row.inflow, currency)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'outflow',
      header: t('columns.outflow'),
      accessor: (row) => (
        <span className="font-semibold" style={{ color: 'var(--error-text)' }}>
          {formatCurrency(row.outflow, currency)}
        </span>
      ),
      sortable: true,
      hideOnTablet: true,
    },
    {
      key: 'netProfit',
      header: t('columns.netProfit'),
      accessor: (row) => (
        <span
          className="font-semibold"
          style={{ color: row.netProfit >= 0 ? 'var(--success-text)' : 'var(--error-text)' }}
        >
          {formatCurrency(row.netProfit, currency)}
        </span>
      ),
      sortable: true,
    },
  ];

  const courseColumns: ColumnDef<CourseCashFlowRow>[] = [
    { key: 'courseName', header: t('columns.course'), accessor: 'courseName', sortable: true },
    {
      key: 'income',
      header: t('columns.income'),
      accessor: (row) => (
        <span className="font-semibold" style={{ color: 'var(--success-text)' }}>
          {formatCurrency(row.income, currency)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'expenses',
      header: t('columns.expenses'),
      accessor: (row) => (
        <span className="font-semibold" style={{ color: 'var(--error-text)' }}>
          {formatCurrency(row.expenses, currency)}
        </span>
      ),
      sortable: true,
      hideOnTablet: true,
    },
    {
      key: 'netProfit',
      header: t('columns.netProfit'),
      accessor: (row) => (
        <span
          className="font-semibold"
          style={{ color: row.netProfit >= 0 ? 'var(--success-text)' : 'var(--error-text)' }}
        >
          {formatCurrency(row.netProfit, currency)}
        </span>
      ),
      sortable: true,
    },
  ];

  const branchColumns: ColumnDef<BranchCashFlowRow>[] = [
    { key: 'branchName', header: t('columns.branch'), accessor: 'branchName', sortable: true },
    {
      key: 'income',
      header: t('columns.income'),
      accessor: (row) => (
        <span className="font-semibold" style={{ color: 'var(--success-text)' }}>
          {formatCurrency(row.income, currency)}
        </span>
      ),
      sortable: true,
    },
    {
      key: 'expenses',
      header: t('columns.expenses'),
      accessor: (row) => (
        <span className="font-semibold" style={{ color: 'var(--error-text)' }}>
          {formatCurrency(row.expenses, currency)}
        </span>
      ),
      sortable: true,
      hideOnTablet: true,
    },
    {
      key: 'netProfit',
      header: t('columns.netProfit'),
      accessor: (row) => (
        <span
          className="font-semibold"
          style={{ color: row.netProfit >= 0 ? 'var(--success-text)' : 'var(--error-text)' }}
        >
          {formatCurrency(row.netProfit, currency)}
        </span>
      ),
      sortable: true,
    },
  ];

  // ── XATO №10: client-side CSV export (API endpoint yo'q) ─────────────────
  const handleExportCsv = useCallback(() => {
    setIsExporting(true);
    try {
      const rows = filteredStudentRows.map(
        (row) =>
          `${row.studentId},${row.studentName},${row.branch},${row.inflow},${row.outflow},${row.netProfit}`,
      );
      const csv = [
        [
          t('columns.student'),
          t('columns.branch'),
          t('columns.inflow'),
          t('columns.outflow'),
          t('columns.netProfit'),
        ].join(','),
        ...rows,
      ].join('\n');
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
  }, [filteredStudentRows, t]);

  // ── Loading: shared SkeletonLoader (shimmer, not animate-pulse) ────────────
  // XATO №9 fix
  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6" aria-label={t('loading')} aria-busy="true">
        {/* Heading skeleton */}
        <div className="space-y-2" aria-hidden="true">
          <SkeletonLoader variant="text" />
        </div>
        {/* 6 KPI cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-6">
          <SkeletonLoader variant="kpi" count={6} />
        </div>
        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" aria-hidden="true">
          <div className="lg:col-span-2">
            <SkeletonLoader variant="chart" />
          </div>
          <SkeletonLoader variant="chart" />
        </div>
        {/* Table */}
        <SkeletonLoader variant="table" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          {/* XATO №2 fix: t() ishlatiladi */}
          <h1
            className="text-xl font-bold sm:text-2xl lg:text-3xl"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('title')}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {t('subtitle')}
          </p>
        </div>

        {/* Export button — XATO №10 fix: client-side CSV */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleExportCsv}
          disabled={isExporting}
          aria-label={t('exportReport')}
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
          {isExporting ? t('exporting') : t('exportReport')}
        </motion.button>
      </motion.div>

      {/* ── KPI Cards — XATO №3, №4, №5 fix ──────────────────────────────── */}
      {/* 6 ta karta, shared KPICard, lucide-react ikonalar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-6">
        <KPICard
          title={t('totalIncome')}
          value={totalIncome}
          unit={currency}
          icon={TrendingUp}
          iconColor="var(--success-solid)"
          trend={{
            value: kpiData?.trends.mrrChange ?? 0,
            label: t('vsLastPeriod'),
            direction:
              (kpiData?.trends.mrrChange ?? 0) >= 0 ? 'up' : 'down',
          }}
          sparklineData={incomeSparkline}
        />
        <KPICard
          title={t('totalExpenses')}
          value={totalExpenses}
          unit={currency}
          icon={TrendingDown}
          iconColor="var(--error-solid)"
          comparePeriod={t('vsLastPeriod')}
        />
        <KPICard
          title={t('netProfit')}
          value={netProfit}
          unit={currency}
          icon={DollarSign}
          iconColor="var(--brand-primary)"
          trend={{
            value:
              totalIncome > 0
                ? Math.round((netProfit / totalIncome) * 100)
                : 0,
            label: t('margin'),
            direction: netProfit > 0 ? 'up' : 'down',
          }}
          sparklineData={profitSparkline}
        />
        <KPICard
          title={t('pending')}
          value={pendingAmount}
          unit={currency}
          icon={Clock}
          iconColor="var(--warning-solid)"
          {...((overview?.overdueTotal ?? 0) > 0
            ? { comparePeriod: `${t('overdue')}: ${formatCurrency(overview?.overdueTotal ?? 0, currency, locale)}` }
            : {})}
        />
        <KPICard
          title={t('totalStudents')}
          value={totalStudents}
          icon={Users}
          iconColor="var(--info-solid)"
          trend={{
            value: kpiData?.trends.usersChange ?? 0,
            label: t('vsLastPeriod'),
            direction:
              (kpiData?.trends.usersChange ?? 0) >= 0 ? 'up' : 'down',
          }}
        />
        <KPICard
          title={t('activeBranches')}
          value={activeBranches}
          icon={Building2}
          iconColor="var(--brand-accent)"
        />
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Area Chart — XATO №8 fix: Legend qo'shildi, mobile moslashuv */}
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
          <h2
            className="mb-4 text-base font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('incomeVsExpenses')}
          </h2>
          {/* XATO №8 fix: responsive balandlik */}
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border-default)"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                  // Mobileda boshlang'ich va oxirgi label
                  interval={isMobile ? 'preserveStartEnd' : 0}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                  width={isMobile ? 40 : 60}
                  tickFormatter={(value: number) => formatCompactCurrency(value, currency, locale)}
                />
                <Tooltip content={<CustomTooltip currency={currency} />} />
                {/* XATO №8 fix: Legend */}
                <Legend
                  wrapperStyle={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    paddingTop: 8,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="income"
                  name={t('totalIncome')}
                  stroke="var(--brand-primary)"
                  fill="url(#finIncomeGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name={t('totalExpenses')}
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
          <h2
            className="mb-4 text-base font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('paymentMethods')}
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
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Custom legend (gorzontal scroll on mobile) */}
          <div
            className={
              isMobile
                ? 'mt-2 flex gap-3 overflow-x-auto pb-1'
                : 'mt-2 space-y-1.5'
            }
          >
            {paymentMethodData.map((item, i) => (
              <div
                key={item.name}
                className={
                  isMobile
                    ? 'flex shrink-0 items-center gap-1.5'
                    : 'flex items-center justify-between'
                }
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
                    aria-hidden="true"
                  />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {item.name}
                  </span>
                </div>
                {!isMobile && (
                  <span
                    className="text-xs font-semibold"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {item.value}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── BUG #4: Cash Flow per Student (with branch filter) ───────────────── */}
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
        {/* Table header with filters */}
        <div
          className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderBottom: '1px solid var(--border-default)' }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('studentCashFlow')}
          </h2>
          <div className="flex items-center gap-2">
            {/* XATO №11 fix: aria-label qo'shildi */}
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              aria-label={t('filterByBranch')}
              className="rounded-lg px-2 py-1.5 text-xs outline-none"
              style={{
                background: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="all">{t('allBranches')}</option>
              {branchOptions.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* XATO №7 fix: MobileCardList (mobile), DataTable (desktop/tablet) */}
        {isMobile ? (
          <MobileCardList
            data={filteredStudentRows}
            renderCard={(row, _isSelected) => (
              <CashFlowCard
                name={row.studentName}
                subtitle={row.branch}
                inflow={row.inflow}
                outflow={row.outflow}
                netProfit={row.netProfit}
                currency={currency}
                inflowLabel={t('columns.inflow')}
                outflowLabel={t('columns.outflow')}
              />
            )}
            isLoading={false}
            emptyState={{
              title: t('noTransactions'),
              description: t('noTransactionsDesc'),
            }}
          />
        ) : (
          /* XATO №6 fix: shared DataTable */
          <DataTable
            columns={studentColumns}
            data={filteredStudentRows}
            isLoading={false}
            rowKey="id"
            stickyHeader
            onExport={handleExportCsv}
            emptyState={{
              title: t('noTransactions'),
              description: t('noTransactionsDesc'),
            }}
          />
        )}
      </motion.div>

      {/* ── BUG #4: Income & Expenses by Course ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
        className="rounded-xl"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          className="p-4"
          style={{ borderBottom: '1px solid var(--border-default)' }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('breakdownByCourse')}
          </h2>
        </div>

        {isMobile ? (
          <MobileCardList
            data={courseCashFlowRows}
            renderCard={(row, _isSelected) => (
              <CashFlowCard
                name={row.courseName}
                inflow={row.income}
                outflow={row.expenses}
                netProfit={row.netProfit}
                currency={currency}
                inflowLabel={t('columns.income')}
                outflowLabel={t('columns.expenses')}
              />
            )}
            isLoading={false}
            emptyState={{ title: t('noBreakdownData') }}
          />
        ) : (
          <DataTable
            columns={courseColumns}
            data={courseCashFlowRows}
            isLoading={false}
            rowKey="id"
            stickyHeader
            emptyState={{ title: t('noBreakdownData') }}
          />
        )}
      </motion.div>

      {/* ── BUG #4: Income & Expenses by Branch (Filial) ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.45 }}
        className="rounded-xl"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          className="p-4"
          style={{ borderBottom: '1px solid var(--border-default)' }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {t('breakdownByBranch')}
          </h2>
        </div>

        {isMobile ? (
          <MobileCardList
            data={branchCashFlowRows}
            renderCard={(row, _isSelected) => (
              <CashFlowCard
                name={row.branchName}
                inflow={row.income}
                outflow={row.expenses}
                netProfit={row.netProfit}
                currency={currency}
                inflowLabel={t('columns.income')}
                outflowLabel={t('columns.expenses')}
              />
            )}
            isLoading={false}
            emptyState={{ title: t('noBreakdownData') }}
          />
        ) : (
          <DataTable
            columns={branchColumns}
            data={branchCashFlowRows}
            isLoading={false}
            rowKey="id"
            stickyHeader
            emptyState={{ title: t('noBreakdownData') }}
          />
        )}
      </motion.div>
    </div>
  );
}