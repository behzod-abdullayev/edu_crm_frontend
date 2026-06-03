'use client';

import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart as RechartsAreaChart,
  Area,
  LineChart as RechartsLineChart,
  Line,
} from 'recharts';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { EmptyState } from '@shared/components/data-display/EmptyState';
import { useIsMobile } from '@shared/hooks/useIsMobile';
import { cn } from '@shared/utils/cn';

// ─── Shared types ─────────────────────────────────────────────────────────────

type TooltipEntry = {
  dataKey?: string;
  name: string;
  value: number | string;
  color?: string;
  fill?: string;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

interface CustomLegendProps {
  payload?: Array<{ value: string; color: string }>;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--color-border)] rounded-xl shadow-lg px-3 py-2.5 text-sm">
      <p className="font-medium text-[var(--color-text-primary)] mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey ?? entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color ?? entry.fill }} />
          <span className="text-[var(--color-text-muted)]">{entry.name}:</span>
          <span className="font-medium text-[var(--color-text-primary)]">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend({ payload }: CustomLegendProps) {
  return (
    <div className="flex items-center gap-4 justify-center flex-wrap mt-2">
      {payload?.map((entry) => (
        <span key={entry.value} className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.value}
        </span>
      ))}
    </div>
  );
}

function ChartWrapper({
  title, children, className,
}: { title?: string | undefined; children: React.ReactNode; className?: string | undefined }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn('bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl p-5', className)}
    >
      {title && <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">{title}</h3>}
      {children}
    </motion.div>
  );
}

// ─── BarChart ─────────────────────────────────────────────────────────────────

export interface BarConfig {
  key: string;
  color: string;
  label: string;
}

interface BarChartProps {
  data: Array<Record<string, unknown>>;
  bars: BarConfig[];
  xKey: string;
  isLoading?: boolean;
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function BarChart({
  data, bars, xKey, isLoading, title, height, showGrid = true, showLegend = true, className,
}: BarChartProps) {
  const isMobile = useIsMobile();
  const chartHeight = height ?? (isMobile ? 200 : 320);

  if (isLoading) return <SkeletonLoader variant="chart" {...(className !== undefined ? { className } : {})} />;
  if (!data.length) return <EmptyState title="No data" {...(className !== undefined ? { className } : {})} />;

  // Horizontal on mobile, vertical on desktop
  const layout = isMobile ? 'vertical' : 'horizontal';

  return (
    <ChartWrapper {...(title !== undefined ? { title } : {})} {...(className !== undefined ? { className } : {})}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{ top: 4, right: 4, left: isMobile ? 60 : -20, bottom: 0 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              horizontal={layout === 'horizontal'}
              vertical={layout === 'vertical'}
            />
          )}
          {layout === 'horizontal' ? (
            <>
              <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
            </>
          ) : (
            <>
              <YAxis dataKey={xKey} type="category" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} width={56} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
            </>
          )}
          <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--color-border)', opacity: 0.3 }} />
          {showLegend && <Legend content={<CustomLegend />} />}
          {bars.map((bar) => (
            <Bar key={bar.key} dataKey={bar.key} name={bar.label} fill={bar.color} radius={[4, 4, 0, 0]} maxBarSize={48} />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ─── PieChart ─────────────────────────────────────────────────────────────────

interface PieDataItem {
  name: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieDataItem[];
  isLoading?: boolean;
  title?: string;
  height?: number;
  className?: string;
}

export function PieChart({ data, isLoading, title, height, className }: PieChartProps) {
  const isMobile = useIsMobile();
  const chartHeight = height ?? (isMobile ? 200 : 300);

  if (isLoading) return <SkeletonLoader variant="chart" {...(className !== undefined ? { className } : {})} />;
  if (!data.length) return <EmptyState title="No data" {...(className !== undefined ? { className } : {})} />;

  return (
    <ChartWrapper {...(title !== undefined ? { title } : {})} {...(className !== undefined ? { className } : {})}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={chartHeight * 0.22}
            outerRadius={chartHeight * 0.38}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <RechartsTooltip content={<CustomTooltip />} />
        </RechartsPieChart>
      </ResponsiveContainer>
      {/* Custom legend with color dots */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 justify-center mt-1">
        {data.map((item) => (
          <span key={item.name} className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            {item.name}
            <span className="font-medium text-[var(--color-text-primary)]">{item.value}</span>
          </span>
        ))}
      </div>
    </ChartWrapper>
  );
}

// ─── AreaChart ────────────────────────────────────────────────────────────────

interface AreaConfig {
  key: string;
  color: string;
  label: string;
}

interface AreaChartProps {
  data: Array<Record<string, unknown>>;
  areas: AreaConfig[];
  xKey: string;
  isLoading?: boolean;
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function AreaChart({
  data, areas, xKey, isLoading, title, height, showGrid = true, showLegend = true, className,
}: AreaChartProps) {
  const isMobile = useIsMobile();
  const chartHeight = height ?? (isMobile ? 200 : 320);

  if (isLoading) return <SkeletonLoader variant="chart" {...(className !== undefined ? { className } : {})} />;
  if (!data.length) return <EmptyState title="No data" {...(className !== undefined ? { className } : {})} />;

  return (
    <ChartWrapper {...(title !== undefined ? { title } : {})} {...(className !== undefined ? { className } : {})}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RechartsAreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            {areas.map((area) => (
              <linearGradient key={area.key} id={`grad-${area.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={area.color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={area.color} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />}
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
          <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-border)' }} />
          {showLegend && <Legend content={<CustomLegend />} />}
          {areas.map((area) => (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              name={area.label}
              stroke={area.color}
              strokeWidth={2}
              fill={`url(#grad-${area.key})`}
              dot={false}
              activeDot={{ r: 4, fill: area.color }}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </ChartWrapper>
  );
}

// ─── SparklineChart ───────────────────────────────────────────────────────────

interface SparklineChartProps {
  data: number[];
  color?: string;
  height?: number;
  className?: string;
}

export function SparklineChart({ data, color = 'var(--color-accent)', height = 40, className }: SparklineChartProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div className={className} aria-hidden="true">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
