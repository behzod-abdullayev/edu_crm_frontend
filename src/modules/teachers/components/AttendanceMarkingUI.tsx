'use client';

import { useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Button } from '@shared/components/ui/button';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { useAttendanceMarking, useTeacherGroups } from '@/modules/teachers/hooks/useTeacher';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { cn } from '@shared/lib/utils';
import type { AttendanceMarkingFormValues } from '../types/teacher.types';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

const schema = z.object({
  groupId: z.string().min(1, 'Select a group'),
  date: z.string().min(1, 'Select a date'),
  entries: z.array(
    z.object({
      studentId: z.string(),
      studentName: z.string(),
      avatarUrl: z.string().optional(),
      status: z.enum(['present', 'absent', 'late', 'excused']),
      note: z.string().optional(),
    }),
  ),
});

type FormValues = z.infer<typeof schema>;

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; activeClass: string }> = {
  present: { label: 'Present', activeClass: 'bg-green-500 text-white border-green-500' },
  absent: { label: 'Absent', activeClass: 'bg-red-500 text-white border-red-500' },
  late: { label: 'Late', activeClass: 'bg-amber-500 text-white border-amber-500' },
  excused: { label: 'Excused', activeClass: 'bg-gray-400 text-white border-gray-400' },
};

const STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

export function AttendanceMarkingUI() {
  const { data: currentUser } = useCurrentUser();
  const teacherId = currentUser?.id ?? '';
  const [groupId, setGroupId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0] ?? '');
  const [isLoaded, setIsLoaded] = useState(false);

  const { data: groups } = useTeacherGroups(teacherId);
  const { prefetchStudents, save, isSaving } = useAttendanceMarking(teacherId);

  const { control, handleSubmit, setValue, watch, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { groupId: '', date, entries: [] },
  });

  const { fields, replace } = useFieldArray({ control, name: 'entries' });

  const loadStudents = useCallback(async () => {
    if (!groupId || !date) return;
    const entries = await prefetchStudents(groupId, date);
    replace(entries);
    setIsLoaded(true);
  }, [groupId, date, prefetchStudents, replace]);

  const markAll = (status: AttendanceStatus) => {
    fields.forEach((_, i) => {
      setValue(`entries.${i}.status`, status);
    });
  };

  const onSubmit = handleSubmit(async (values: FormValues) => {
    // Map FormValues to AttendanceMarkingFormValues — strip explicit undefined so
    // exactOptionalPropertyTypes is satisfied.
    const mapped: AttendanceMarkingFormValues = {
      groupId: values.groupId,
      date: values.date,
      entries: values.entries.map((e) => ({
        studentId: e.studentId,
        studentName: e.studentName,
        status: e.status,
        ...(e.avatarUrl !== undefined ? { avatarUrl: e.avatarUrl } : {}),
        ...(e.note !== undefined ? { note: e.note } : {}),
      })),
    };
    await save(mapped);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 space-y-1.5">
          <Label>Group</Label>
          <Select
            value={groupId}
            onValueChange={(v) => { setGroupId(v); setValue('groupId', v); setIsLoaded(false); }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select group…" />
            </SelectTrigger>
            <SelectContent>
              {(groups ?? []).map((g) => (
                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1.5">
          <Label>Date</Label>
          <input
            type="date"
            value={date}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => { setDate(e.target.value); setValue('date', e.target.value); setIsLoaded(false); }}
            className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex items-end">
          <Button type="button" variant="outline" onClick={loadStudents} disabled={!groupId || !date}>
            Load Students
          </Button>
        </div>
      </div>

      {/* Bulk actions */}
      {isLoaded && fields.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap animate-in slide-in-from-top-2 fade-in duration-200">
          <span className="text-sm text-muted-foreground mr-1">Mark all:</span>
          {STATUSES.map((s) => (
            <Button key={s} type="button" size="sm" variant="outline" onClick={() => markAll(s)}
              className="h-8 text-xs capitalize">
              {STATUS_CONFIG[s].label}
            </Button>
          ))}
        </div>
      )}

      {/* Student list */}
      {isLoaded && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No students in this group.</p>
          ) : (
            fields.map((field, i) => {
              const status = watch(`entries.${i}.status`);
              return (
                <div
                  key={field.id}
                  className="flex items-center gap-4 p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={field.avatarUrl} alt={field.studentName} />
                    <AvatarFallback className="text-xs">
                      {field.studentName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>

                  <span className="flex-1 font-medium text-sm min-w-0 truncate">{field.studentName}</span>

                  {/* Status buttons */}
                  <div className="flex items-center gap-1 flex-wrap justify-end">
                    {STATUSES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setValue(`entries.${i}.status`, s)}
                        className={cn(
                          'min-h-[44px] min-w-[44px] px-3 rounded-lg border text-xs font-medium transition-all duration-150',
                          'sm:min-h-[36px] sm:min-w-[36px] sm:h-9 sm:px-3',
                          status === s ? STATUS_CONFIG[s].activeClass : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-muted',
                        )}
                        aria-pressed={status === s}
                        aria-label={`Mark ${field.studentName} as ${s}`}
                      >
                        {STATUS_CONFIG[s].label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Save */}
      {isLoaded && fields.length > 0 && (
        <div className="flex justify-end animate-in fade-in duration-200">
          <Button type="submit" disabled={isSaving} className="min-w-[140px]">
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                Saving…
              </span>
            ) : 'Save Attendance'}
          </Button>
        </div>
      )}
    </form>
  );
}
