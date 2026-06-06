'use client';

import { useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@shared/components/ui/avatar';
import { Button } from '@shared/components/ui/button';
import { Label } from '@shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { useAttendanceMarking, useTeacherGroups } from '@/modules/teachers/hooks/useTeacher';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { cn } from '@shared/lib/utils';
import type { AttendanceMarkingFormValues } from '../types/teacher.types';
import { CheckCircle2, XCircle, Clock, FileCheck, Users, Save } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const entrySchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  avatarUrl: z.string().optional(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  note: z.string().optional(),
});

const schema = z.object({
  groupId: z.string().min(1, 'Please select a group'),
  date: z.string().min(1, 'Please select a date'),
  entries: z.array(entrySchema),
});

type FormValues = z.infer<typeof schema>;

// ─── Status configuration ─────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  icon: React.ReactNode;
  activeClass: string;
  hoverClass: string;
}

const STATUS_CONFIG: Record<AttendanceStatus, StatusConfig> = {
  present: {
    label: 'Present',
    icon: <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />,
    activeClass:
      'bg-[var(--success-solid)] text-white border-[var(--success-solid)] shadow-sm',
    hoverClass: 'hover:border-[var(--success-solid)] hover:text-[var(--success-solid)]',
  },
  absent: {
    label: 'Absent',
    icon: <XCircle className="w-3.5 h-3.5" aria-hidden="true" />,
    activeClass:
      'bg-[var(--error-solid)] text-white border-[var(--error-solid)] shadow-sm',
    hoverClass: 'hover:border-[var(--error-solid)] hover:text-[var(--error-solid)]',
  },
  late: {
    label: 'Late',
    icon: <Clock className="w-3.5 h-3.5" aria-hidden="true" />,
    activeClass:
      'bg-[var(--warning-solid)] text-white border-[var(--warning-solid)] shadow-sm',
    hoverClass: 'hover:border-[var(--warning-solid)] hover:text-[var(--warning-solid)]',
  },
  excused: {
    label: 'Excused',
    icon: <FileCheck className="w-3.5 h-3.5" aria-hidden="true" />,
    activeClass: 'bg-slate-400 text-white border-slate-400 shadow-sm',
    hoverClass: 'hover:border-slate-400 hover:text-slate-500',
  },
};

const STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

// ─── Status summary bar ───────────────────────────────────────────────────────

interface SummaryBarProps {
  counts: Record<AttendanceStatus, number>;
  total: number;
}

function SummaryBar({ counts, total }: SummaryBarProps) {
  if (total === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-center gap-3 flex-wrap',
        'px-4 py-2.5 rounded-xl',
        'bg-[var(--bg-surface-secondary)] border border-[var(--border-default)]',
      )}
      role="status"
      aria-label="Attendance summary"
    >
      <span className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
        <Users className="w-3.5 h-3.5" aria-hidden="true" />
        {total} students
      </span>
      <span className="text-[var(--border-default)] select-none" aria-hidden="true">
        ·
      </span>
      {STATUSES.map((s) => (
        <span
          key={s}
          className="flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)]"
        >
          {STATUS_CONFIG[s].icon}
          {counts[s]} {STATUS_CONFIG[s].label.toLowerCase()}
        </span>
      ))}
    </motion.div>
  );
}

// ─── Student row ──────────────────────────────────────────────────────────────

interface StudentRowProps {
  index: number;
  studentName: string;
  avatarUrl?: string;
  currentStatus: AttendanceStatus;
  onStatusChange: (index: number, status: AttendanceStatus) => void;
  animationDelay: number;
}

function StudentRow({
  index,
  studentName,
  avatarUrl,
  currentStatus,
  onStatusChange,
  animationDelay,
}: StudentRowProps) {
  const initials = studentName
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2, delay: Math.min(animationDelay, 0.5) }}
      className={cn(
        'flex items-center gap-3 sm:gap-4 p-3 sm:p-4',
        'rounded-xl border border-[var(--border-default)]',
        'bg-[var(--bg-surface)]',
        'hover:bg-[var(--bg-surface-hover)]',
        'transition-colors duration-[var(--transition-fast)]',
      )}
    >
      {/* Avatar */}
      <Avatar className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
        <AvatarImage src={avatarUrl} alt={studentName} />
        <AvatarFallback className="text-xs font-medium bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <span
        className="flex-1 text-sm font-medium text-[var(--text-primary)] min-w-0 truncate"
        title={studentName}
      >
        {studentName}
      </span>

      {/* Status buttons */}
      <div
        className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0"
        role="group"
        aria-label={`Attendance status for ${studentName}`}
      >
        {STATUSES.map((status) => {
          const cfg = STATUS_CONFIG[status];
          const isActive = currentStatus === status;

          return (
            <motion.button
              key={status}
              type="button"
              whileTap={{ scale: 0.93 }}
              onClick={() => onStatusChange(index, status)}
              className={cn(
                'min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-auto',
                'sm:h-9 sm:px-2.5 rounded-lg border text-xs font-medium',
                'flex items-center justify-center sm:gap-1.5',
                'transition-all duration-[var(--transition-fast)]',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
                'w-11 sm:w-auto',
                isActive
                  ? cfg.activeClass
                  : cn(
                      'border-[var(--border-default)] text-[var(--text-muted)]',
                      'bg-[var(--bg-surface)]',
                      cfg.hoverClass,
                    ),
              )}
              aria-pressed={isActive}
              aria-label={`Mark ${studentName} as ${status}`}
              title={cfg.label}
            >
              {cfg.icon}
              <span className="hidden sm:inline">{cfg.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AttendanceMarkingUI() {
  const { user: currentUser } = useCurrentUser();
  const teacherId = currentUser?.id ?? '';

  const [groupId, setGroupId] = useState('');
  const [date, setDate] = useState<string>(
    () => new Date().toISOString().split('T')[0] ?? '',
  );
  const [isLoaded, setIsLoaded] = useState(false);

  const { data: groups } = useTeacherGroups(teacherId);
  const { prefetchStudents, save, isSaving } = useAttendanceMarking(teacherId);

  const { control, handleSubmit, setValue, watch, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { groupId: '', date, entries: [] },
  });

  const { fields, replace } = useFieldArray({ control, name: 'entries' });

  // ── Status counts for summary ───────────────────────────────────────────
  const entries = watch('entries');
  const statusCounts: Record<AttendanceStatus, number> = {
    present: entries.filter((e) => e.status === 'present').length,
    absent: entries.filter((e) => e.status === 'absent').length,
    late: entries.filter((e) => e.status === 'late').length,
    excused: entries.filter((e) => e.status === 'excused').length,
  };

  // ── Load students from API ──────────────────────────────────────────────
  const loadStudents = useCallback(async () => {
    if (!groupId || !date) return;
    setIsLoaded(false);
    const fetched = await prefetchStudents(groupId, date);
    replace(fetched);
    setValue('groupId', groupId);
    setValue('date', date);
    setIsLoaded(true);
  }, [groupId, date, prefetchStudents, replace, setValue]);

  // ── Mark all students with the same status ──────────────────────────────
  const markAll = useCallback(
    (status: AttendanceStatus) => {
      fields.forEach((_, i) => {
        setValue(`entries.${i}.status`, status, { shouldDirty: true });
      });
    },
    [fields, setValue],
  );

  // ── Per-student status toggle ───────────────────────────────────────────
  const handleStatusChange = useCallback(
    (index: number, status: AttendanceStatus) => {
      setValue(`entries.${index}.status`, status, { shouldDirty: true });
    },
    [setValue],
  );

  // ── Form submit ─────────────────────────────────────────────────────────
  const onSubmit = handleSubmit(async (values: FormValues) => {
    const mapped: AttendanceMarkingFormValues = {
      groupId: values.groupId,
      date: values.date,
      entries: values.entries.map((e) => ({
        studentId: e.studentId,
        studentName: e.studentName,
        status: e.status,
        ...(e.avatarUrl !== undefined ? { avatarUrl: e.avatarUrl } : {}),
        ...(e.note !== undefined && e.note !== '' ? { note: e.note } : {}),
      })),
    };
    await save(mapped);
    reset({ groupId: '', date, entries: [] });
    setGroupId('');
    setIsLoaded(false);
  });

  const maxDate = new Date().toISOString().split('T')[0] ?? '';

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6"
      noValidate
      aria-label="Mark attendance form"
    >
      {/* ── Controls row ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Group select */}
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="attendance-group">
            Group{' '}
            <span className="text-[var(--error-solid)]" aria-hidden="true">
              *
            </span>
          </Label>
          <Select
            value={groupId}
            onValueChange={(v) => {
              setGroupId(v);
              setValue('groupId', v);
              setIsLoaded(false);
            }}
          >
            <SelectTrigger
              id="attendance-group"
              aria-required="true"
              className="h-10"
            >
              <SelectValue placeholder="Select group…" />
            </SelectTrigger>
            <SelectContent>
              {(groups ?? []).map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date input */}
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="attendance-date">
            Date{' '}
            <span className="text-[var(--error-solid)]" aria-hidden="true">
              *
            </span>
          </Label>
          <input
            id="attendance-date"
            type="date"
            value={date}
            max={maxDate}
            onChange={(e) => {
              const v = e.target.value;
              setDate(v);
              setValue('date', v);
              setIsLoaded(false);
            }}
            aria-required="true"
            className={cn(
              'w-full h-10 rounded-lg border border-[var(--border-default)]',
              'bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]',
              'transition-all duration-[var(--transition-fast)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)]',
              'focus:ring-offset-2 focus:border-[var(--border-focus)]',
            )}
          />
        </div>

        {/* Load button */}
        <div className="flex items-end">
          <motion.div whileTap={{ scale: 0.97 }} className="w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadStudents()}
              disabled={!groupId || !date}
              className="w-full sm:w-auto min-h-[40px]"
            >
              Load Students
            </Button>
          </motion.div>
        </div>
      </div>

      {/* ── Loaded content ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isLoaded && (
          <motion.div
            key="attendance-loaded"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-5"
          >
            {/* Bulk actions */}
            {fields.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2 flex-wrap"
                role="group"
                aria-label="Mark all students"
              >
                <span className="text-sm text-[var(--text-muted)] mr-1">
                  Mark all:
                </span>
                {STATUSES.map((s) => {
                  const cfg = STATUS_CONFIG[s];
                  return (
                    <motion.button
                      key={s}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => markAll(s)}
                      className={cn(
                        'h-8 px-3 rounded-lg border text-xs font-medium',
                        'flex items-center gap-1.5',
                        'border-[var(--border-default)] text-[var(--text-secondary)]',
                        'bg-[var(--bg-surface)]',
                        'transition-all duration-[var(--transition-fast)]',
                        'focus-visible:outline-none focus-visible:ring-2',
                        'focus-visible:ring-[var(--border-focus)]',
                        cfg.hoverClass,
                      )}
                    >
                      {cfg.icon}
                      {cfg.label}
                    </motion.button>
                  );
                })}
              </motion.div>
            )}

            {/* Summary */}
            <SummaryBar counts={statusCounts} total={fields.length} />

            {/* Student list */}
            <div
              className="space-y-2"
              role="list"
              aria-label="Student attendance list"
            >
              {fields.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-[var(--text-muted)] text-center py-10"
                >
                  No students found in this group.
                </motion.p>
              ) : (
                fields.map((field, i) => {
                  const rawStatus = watch(`entries.${i}.status`);
                  const status: AttendanceStatus =
                    rawStatus === 'absent' ||
                    rawStatus === 'late' ||
                    rawStatus === 'excused'
                      ? rawStatus
                      : 'present';

                  return (
                    <div key={field.id} role="listitem">
                      <StudentRow
                        index={i}
                        studentName={field.studentName}
                        {...(field.avatarUrl !== undefined
                          ? { avatarUrl: field.avatarUrl }
                          : {})}
                        currentStatus={status}
                        onStatusChange={handleStatusChange}
                        animationDelay={i * 0.04}
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Save */}
            {fields.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2"
              >
                <p className="text-xs text-[var(--text-muted)]">
                  {statusCounts.present} present · {statusCounts.absent} absent ·{' '}
                  {statusCounts.late} late · {statusCounts.excused} excused
                </p>
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto min-w-[160px] min-h-[44px] sm:min-h-[40px]"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                          aria-hidden="true"
                        />
                        Saving…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="w-4 h-4" aria-hidden="true" />
                        Save Attendance
                      </span>
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
