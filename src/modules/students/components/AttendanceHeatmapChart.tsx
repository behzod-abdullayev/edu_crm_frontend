'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@shared/utils/cn';
import type { AttendanceRecord } from '../types/student.types';
import type { AttendanceStatus } from '@shared/types/attendance';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  records: AttendanceRecord[];
}

// ─── Status config ────────────────────────────────────────────────────────────

interface StatusConfig {
  bg: string;
  label: string;
}

const STATUS_CONFIG: Record<AttendanceStatus, StatusConfig> = {
  present: { bg: 'bg-[var(--success-solid)]',   label: 'Present'  },
  late:    { bg: 'bg-[var(--warning-solid)]',   label: 'Late'     },
  absent:  { bg: 'bg-[var(--error-solid)]',     label: 'Absent'   },
  excused: { bg: 'bg-[var(--text-muted)]',       label: 'Excused'  },
};

const NO_CLASS_BG = 'bg-[var(--bg-surface-hover)]';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildLast30Days(): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const dd   = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
  });
}

// ─── Cell ─────────────────────────────────────────────────────────────────────

interface CellProps {
  date:   string;
  status: AttendanceStatus | undefined;
  index:  number;
}

function HeatmapCell({ date, status, index }: CellProps) {
  const config    = status !== undefined ? STATUS_CONFIG[status] : null;
  const bgClass   = config !== null ? config.bg : NO_CLASS_BG;
  const ariaLabel = `${formatDateLabel(date)}: ${config?.label ?? 'No class'}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.15,
        delay: Math.min(index * 0.015, 0.4),
        ease: 'easeOut',
      }}
      title={ariaLabel}
      aria-label={ariaLabel}
      role="img"
      className={cn(
        'w-5 h-5 rounded-sm transition-transform duration-150',
        'hover:scale-125 cursor-default',
        bgClass,
      )}
    />
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3"
      role="list"
      aria-label="Attendance legend"
    >
      {(Object.entries(STATUS_CONFIG) as [AttendanceStatus, StatusConfig][]).map(
        ([status, { bg, label }]) => (
          <div
            key={status}
            role="listitem"
            className="flex items-center gap-1.5"
          >
            <span
              className={cn('inline-block w-3 h-3 rounded-sm shrink-0', bg)}
              aria-hidden="true"
            />
            <span className="text-xs text-[var(--text-muted)]">{label}</span>
          </div>
        ),
      )}
      <div role="listitem" className="flex items-center gap-1.5">
        <span
          className={cn('inline-block w-3 h-3 rounded-sm shrink-0', NO_CLASS_BG)}
          aria-hidden="true"
        />
        <span className="text-xs text-[var(--text-muted)]">No class</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AttendanceHeatmapChart({ records }: Props) {
  const last30 = useMemo(() => buildLast30Days(), []);

  const statusMap = useMemo<Map<string, AttendanceStatus>>(() => {
    return new Map(records.map((r) => [r.date, r.status]));
  }, [records]);

  return (
    <div className="space-y-1">
      {/* Grid label */}
      <p
        className="text-xs text-[var(--text-muted)] mb-2"
        aria-live="polite"
      >
        Last 30 days attendance
      </p>

      {/* Heatmap grid */}
      <div
        className="flex flex-wrap gap-1"
        role="group"
        aria-label="Attendance heatmap for the last 30 days"
      >
        {last30.map((date, i) => (
          <HeatmapCell
            key={date}
            date={date}
            status={statusMap.get(date)}
            index={i}
          />
        ))}
      </div>

      {/* Legend */}
      <Legend />
    </div>
  );
}