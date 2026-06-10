'use client';

import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@shared/utils/cn';

interface DateRange {
  from: Date;
  to?: Date;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function DateRangePicker({
  value,
  onChange,
  disabled = false,
  placeholder,
  className,
}: DateRangePickerProps) {
  const t = useTranslations('datepicker');
  const [viewDate, setViewDate] = useState(value?.from ?? new Date());
  const [hovered, setHovered] = useState<Date | null>(null);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const displayValue = value?.from
    ? value.to
      ? `${format(value.from, 'MMM d, yyyy')} – ${format(value.to, 'MMM d, yyyy')}`
      : format(value.from, 'MMM d, yyyy')
    : null;

  const handleDayClick = (day: Date) => {
    if (!value?.from || (value.from && value.to)) {
      onChange({ from: day });
    } else {
      if (day < value.from) {
        onChange({ from: day, to: value.from });
      } else {
        onChange({ from: value.from, to: day });
      }
    }
  };

  const isInRange = (day: Date) => {
    const end = value?.to ?? hovered;
    if (!value?.from || !end) return false;
    const [a, b] = value.from <= end ? [value.from, end] : [end, value.from];
    return isWithinInterval(day, { start: a, end: b });
  };

  return (
    <div className={className}>
      {/* Mobile: native date inputs */}
      <div className="sm:hidden flex flex-col gap-2">
        <input
          type="date"
          value={value?.from ? format(value.from, 'yyyy-MM-dd') : ''}
          onChange={(e) => e.target.value && onChange({ from: new Date(e.target.value), ...(value?.to !== undefined ? { to: value.to } : {}) })}
          disabled={disabled}
          aria-label={t('startDate')}
          className="w-full h-11 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--bg-surface)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] disabled:opacity-50"
        />
        <input
          type="date"
          value={value?.to ? format(value.to, 'yyyy-MM-dd') : ''}
          onChange={(e) => value?.from && e.target.value && onChange({ from: value.from, to: new Date(e.target.value) })}
          disabled={disabled || !value?.from}
          aria-label={t('endDate')}
          min={value?.from ? format(value.from, 'yyyy-MM-dd') : undefined}
          className="w-full h-11 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--bg-surface)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] disabled:opacity-50"
        />
      </div>

      {/* Desktop: popover calendar */}
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            disabled={disabled}
            aria-label={t('selectRange')}
            className={cn(
              'hidden sm:flex items-center gap-2 w-full h-11 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--bg-surface)]',
              'text-sm text-left transition-colors hover:bg-[var(--bg-sidebar-item-hover)]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <CalendarDays size={15} className="text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
            <span className={displayValue ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]'}>
              {displayValue ?? (placeholder ?? t('placeholder'))}
            </span>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content sideOffset={6} align="start" asChild>
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="z-50 bg-[var(--bg-surface)] border border-[var(--color-border)] rounded-xl shadow-xl p-4 w-72 outline-none"
            >
              {/* Month nav */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                  aria-label={t('prevMonth')}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-sidebar-item-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {format(viewDate, 'MMMM yyyy')}
                </span>
                <button
                  onClick={() => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                  aria-label={t('nextMonth')}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-sidebar-item-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="text-center text-[10px] font-medium text-[var(--color-text-muted)] py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((day) => {
                  const isFrom = value?.from && isSameDay(day, value.from);
                  const isTo = value?.to && isSameDay(day, value.to);
                  const inRange = isInRange(day);
                  const isCurrentMonth = day.getMonth() === viewDate.getMonth();

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      onMouseEnter={() => setHovered(day)}
                      onMouseLeave={() => setHovered(null)}
                      aria-label={format(day, 'MMMM d, yyyy')}
                      aria-pressed={isFrom || isTo ? true : undefined}
                      className={cn(
                        'h-8 w-full text-xs font-medium rounded-lg transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
                        !isCurrentMonth && 'opacity-30',
                        (isFrom || isTo) && 'bg-[var(--color-accent)] text-white',
                        inRange && !isFrom && !isTo && 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] rounded-none',
                        !isFrom && !isTo && !inRange && 'hover:bg-[var(--bg-sidebar-item-hover)] text-[var(--color-text-primary)]'
                      )}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
