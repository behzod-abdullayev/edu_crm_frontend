'use client';

import { useEffect, useRef, useState } from 'react';
import { GlobalKPIData } from '../types/owner.types';

function useCountUp(target: number, duration = 1500): number {
  const [value, setValue] = useState(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return value;
}

interface KPICardProps {
  label: string;
  rawValue: number;
  trend: number;
  prefix?: string;
  suffix?: string;
  formatFn?: (v: number) => string;
}

function KPICard({ label, rawValue, trend, prefix = '', suffix = '', formatFn }: KPICardProps) {
  const animated = useCountUp(rawValue);
  const displayValue = formatFn ? formatFn(animated) : animated.toLocaleString();
  const isPositive = trend >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-md">
      <div className="absolute right-0 top-0 h-24 w-24 -translate-y-4 translate-x-4 rounded-full bg-primary/5" aria-hidden="true" />
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black tabular-nums tracking-tight text-foreground">
        {prefix}{displayValue}{suffix}
      </p>
      <div
        className={[
          'mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
          isPositive
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        ].join(' ')}
      >
        <span aria-hidden="true">{isPositive ? '↑' : '↓'}</span>
        {Math.abs(trend)}%
        <span className="font-normal opacity-70">vs last month</span>
      </div>
    </div>
  );
}

interface GlobalKPIDashboardProps {
  data: GlobalKPIData;
}

export function GlobalKPIDashboard({ data }: GlobalKPIDashboardProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      <KPICard
        label="MRR"
        rawValue={data.mrr}
        trend={data.trends?.mrrChange ?? 0}
        formatFn={(v) => `${(v / 1_000_000).toFixed(1)}M`}
        suffix=" UZS"
      />
      <KPICard
        label="ARR"
        rawValue={data.arr}
        trend={(data.trends?.mrrChange ?? 0) * 1.1}
        formatFn={(v) => `${(v / 1_000_000).toFixed(0)}M`}
        suffix=" UZS"
      />
      <KPICard
        label="Total Users"
        rawValue={data.totalUsers}
        trend={data.trends?.usersChange ?? 0}
      />
      <KPICard
        label="Branches"
        rawValue={data.totalBranches}
        trend={0}
      />
      <KPICard
        label="Active Courses"
        rawValue={data.activeCourses}
        trend={0}
      />
      <KPICard
        label="Revenue Growth"
        rawValue={data.revenueGrowthPercent}
        trend={data.revenueGrowthPercent}
        suffix="%"
      />
    </div>
  );
}