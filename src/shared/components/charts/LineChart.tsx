'use client';

import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { useTranslations } from 'next-intl';
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
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

interface CustomLegendProps {
  payload?: Array<{ value: string; color: string }>;
}

// ─── Shared Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--color-border)] rounded-xl shadow-lg px-3 py-2.5 text-sm">
      <p className="font-medium text-[var(--color-text-primary)] mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey ?? entry.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
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

// ─── LineChart ───────────────────────────────────────────────────────────────

export interface LineConfig {
  key: string;
  color: string;
  label: string;
  strokeWidth?: number;
}

interface LineChartProps {
  data: Array<Record<string, unknown>>;
  lines: LineConfig[];
  xKey: string;
  isLoading?: boolean;
  title?: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  className?: string;
}

export function LineChart({
  data,
  lines,
  xKey,
  isLoading,
  title,
  height,
  showGrid = true,
  showLegend = true,
  className,
}: LineChartProps) {
  const isMobile = useIsMobile();
  const chartHeight = height ?? (isMobile ? 200 : 320);

  if (isLoading) return <SkeletonLoader variant="chart" {...(className !== undefined ? { className } : {})} />;
  if (!data.length) return <EmptyState title="No data" {...(className !== undefined ? { className } : {})} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn('bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl p-5', className)}
    >
      {title && (
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RechartsLineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />}
          <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
          <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--color-border)' }} />
          {showLegend && <Legend content={<CustomLegend />} />}
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.label}
              stroke={line.color}
              strokeWidth={line.strokeWidth ?? 2}
              dot={false}
              activeDot={{ r: 4, fill: line.color }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
