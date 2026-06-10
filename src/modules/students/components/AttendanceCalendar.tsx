'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  ATTENDANCE_STATUS_META,
  type AttendanceStatus,
} from '@shared/types/attendance';
import type { AttendanceRecord } from '../types/student.types';
import { cn } from '@shared/utils/cn';

// ─── Constants ────────────────────────────────────────────────────────────────

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
  onMonthChange?: (year: number, month: number) => void;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDayGrid(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const grid: (number | null)[] = Array(firstWeekday).fill(null) as null[];
  for (let d = 1; d <= lastDay; d++) grid.push(d);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

function toDateStr(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

// ─── Day cell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  day: number;
  dateStr: string;
  record: AttendanceRecord | undefined;
  isToday: boolean;
  isFuture: boolean;
  isHovered: boolean;
  onHover: (d: string | null) => void;
}

function DayCell({
  day,
  dateStr,
  record,
  isToday,
  isFuture,
  isHovered,
  onHover,
}: DayCellProps) {
  const meta = record ? ATTENDANCE_STATUS_META[record.status] : null;

  const cellClasses = cn(
    'relative flex aspect-square w-full cursor-default items-center justify-center',
    'rounded-lg text-xs font-medium select-none',
    'transition-colors duration-[var(--transition-fast,150ms)]',
    record && meta
      ? `${meta.bgClass} ${meta.textClass} border ${meta.borderClass}`
      : isToday
        ? 'ring-2 ring-[var(--brand-primary)] ring-offset-1 bg-[var(--info-bg)] text-[var(--brand-primary)]'
        : isFuture
          ? 'text-[var(--text-muted)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
  );

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => onHover(dateStr)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(dateStr)}
      onBlur={() => onHover(null)}
    >
      <div
        className={cellClasses}
        aria-label={
          record
            ? `${dateStr}: ${record.status}${record.courseName ? ` — ${record.courseName}` : ''}`
            : isToday
              ? `${dateStr}: today`
              : dateStr
        }
        role="cell"
      >
        {day}
      </div>

      {/* Tooltip — desktop hover only */}
      <AnimatePresence>
        {isHovered && record && (
          <motion.div
            key="tooltip"
            role="tooltip"
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className={cn(
              'pointer-events-none absolute bottom-full z-20 mb-2',
              'left-1/2 -translate-x-1/2',
              'rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)]',
              'px-2.5 py-1.5 shadow-[var(--shadow-md)] whitespace-nowrap',
              'text-xs',
            )}
          >
            <p className={cn('font-semibold capitalize', meta?.textClass)}>
              {record.status}
            </p>
            {record.courseName && (
              <p className="text-[var(--text-muted)] mt-0.5">
                {record.courseName}
              </p>
            )}
            {record.teacherName && (
              <p className="text-[var(--text-muted)]">{record.teacherName}</p>
            )}
            {record.note && (
              <p className="text-[var(--text-secondary)] mt-0.5 max-w-[180px] truncate">
                {record.note}
              </p>
            )}
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-[var(--border-default)]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Summary bar ──────────────────────────────────────────────────────────────

interface SummaryBarProps {
  records: AttendanceRecord[];
}

function SummaryBar({ records }: SummaryBarProps) {
  const counts = useMemo(() => {
    const c: Record<AttendanceStatus, number> = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };
    for (const r of records) {
      // status is typed as AttendanceStatus so direct indexing is safe
      c[r.status]++;
    }
    return c;
  }, [records]);

  const total = records.length;
  const rate =
    total > 0
      ? Math.round(((counts.present + counts.late) / total) * 100)
      : 0;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] px-4 py-3"
      aria-label="Attendance summary"
    >
      <div className="flex items-baseline gap-1">
        <span
          className={cn(
            'text-2xl font-black tabular-nums',
            rate >= 80
              ? 'text-[var(--success-solid)]'
              : rate >= 60
                ? 'text-[var(--warning-solid)]'
                : 'text-[var(--error-solid)]',
          )}
          aria-label={`Attendance rate: ${rate}%`}
        >
          {rate}%
        </span>
        <span className="text-xs text-[var(--text-muted)]">rate</span>
      </div>

      <div className="flex flex-wrap gap-3">
        {(
          Object.entries(ATTENDANCE_STATUS_META) as [
            AttendanceStatus,
            (typeof ATTENDANCE_STATUS_META)[AttendanceStatus],
          ][]
        ).map(([status, meta]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                meta.bgClass,
                `border ${meta.borderClass}`,
              )}
            />
            <span
              className="text-xs text-[var(--text-secondary)] capitalize"
              aria-label={`${status}: ${counts[status]}`}
            >
              {status}: <strong>{counts[status]}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AttendanceCalendar({
  records,
  onMonthChange,
  className,
}: AttendanceCalendarProps) {
  const _t = useTranslations('student.attendance');
  const reduced = useReducedMotion() ?? false;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const recordMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of records) {
      map.set(r.date, r);
    }
    return map;
  }, [records]);

  const monthRecords = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return records.filter((r) => r.date.startsWith(prefix));
  }, [records, year, month]);

  const days = useMemo(() => buildDayGrid(year, month), [year, month]);

  const monthLabel = new Date(year, month).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  function navigate(dir: -1 | 1) {
    let m = month + dir;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
    onMonthChange?.(y, m + 1);
  }

  return (
    <section
      className={cn('space-y-4', className)}
      aria-label="Attendance calendar"
    >
      {/* ── Month navigation ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Previous month"
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            'border border-[var(--border-default)] bg-[var(--bg-surface)]',
            'text-[var(--text-secondary)] transition-colors duration-[var(--transition-fast)]',
            'hover:bg-[var(--bg-surface-hover)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
          )}
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        <motion.h2
          key={`${year}-${month}`}
          initial={reduced ? false : { opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="text-sm font-semibold text-[var(--text-primary)]"
          aria-live="polite"
          aria-atomic="true"
        >
          {monthLabel}
        </motion.h2>

        <button
          type="button"
          onClick={() => navigate(1)}
          disabled={isCurrentMonth}
          aria-label="Next month"
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg',
            'border border-[var(--border-default)] bg-[var(--bg-surface)]',
            'text-[var(--text-secondary)] transition-colors duration-[var(--transition-fast)]',
            'hover:bg-[var(--bg-surface-hover)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>

      {/* ── Weekday headers ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-1" role="row">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]"
            role="columnheader"
            aria-label={label}
          >
            {label.charAt(0)}
          </div>
        ))}
      </div>

      {/* ── Day grid ─────────────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-7 gap-1"
        role="grid"
        aria-label={`Attendance for ${monthLabel}`}
      >
        {days.map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`empty-${idx}`}
                role="cell"
                aria-hidden="true"
              />
            );
          }
          const dateStr = toDateStr(year, month, day);
          const record = recordMap.get(dateStr);
          const dayDate = new Date(year, month, day);
          const isToday =
            day === now.getDate() &&
            month === now.getMonth() &&
            year === now.getFullYear();
          const isFuture = dayDate > now && !isToday;

          return (
            <DayCell
              key={dateStr}
              day={day}
              dateStr={dateStr}
              record={record}
              isToday={isToday}
              isFuture={isFuture}
              isHovered={hoveredDate === dateStr}
              onHover={setHoveredDate}
            />
          );
        })}
      </div>

      {/* ── Monthly summary ───────────────────────────────────────────────── */}
      {monthRecords.length > 0 && <SummaryBar records={monthRecords} />}

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center justify-center gap-3 pt-1"
        role="list"
        aria-label="Status legend"
      >
        {(
          Object.entries(ATTENDANCE_STATUS_META) as [
            AttendanceStatus,
            (typeof ATTENDANCE_STATUS_META)[AttendanceStatus],
          ][]
        ).map(([status, meta]) => (
          <div
            key={status}
            className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]"
            role="listitem"
          >
            <span
              aria-hidden="true"
              className={cn(
                'h-2.5 w-2.5 rounded-sm border',
                meta.bgClass,
                meta.borderClass,
              )}
            />
            <span className="capitalize">{status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
