'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Switch } from '@shared/components/ui/switch';
import { useHomeworkCreate, useTeacherGroups } from '@/modules/teachers/hooks/useTeacher';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { parseApiError } from '@shared/utils/api-error';
import type { HomeworkCreateFormValues } from '../types/teacher.types';

// Named export → wrap in default so Next.js dynamic() can load it.
const RichTextEditor = dynamic(
  () => import('@shared/components/forms/RichTextEditor').then((m) => ({ default: m.RichTextEditor })),
  { ssr: false },
);

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  groupId: z.string().min(1, 'Group is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  maxPoints: z.number().int().min(1).max(1000),
  allowResubmit: z.boolean(),
  attachedFileKeys: z.array(z.string()),
});

interface HomeworkCreatorProps {
  onSuccess?: () => void;
}

export function HomeworkCreator({ onSuccess }: HomeworkCreatorProps) {
  const { data: currentUser } = useCurrentUser();
  const teacherId = currentUser?.id ?? '';
  const router = useRouter();
  const { data: groups } = useTeacherGroups(teacherId);
  const createMutation = useHomeworkCreate(teacherId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<HomeworkCreateFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      groupId: '',
      dueDate: '',
      maxPoints: 100,
      allowResubmit: false,
      attachedFileKeys: [],
    },
  });

  const description = watch('description');
  const allowResubmit = watch('allowResubmit');

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createMutation.mutateAsync(values);
      onSuccess?.();
      router.push('/teacher/homework');
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      Object.entries(parsed.errors).forEach(([field, messages]) => {
        setError(field as keyof HomeworkCreateFormValues, {
          type: 'server',
          message: (Array.isArray(messages) ? messages[0] : String(messages)) ?? '',
        });
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {/* Title */}
      <div className="space-y-1.5">
        <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
        <Input id="title" {...register('title')} placeholder="e.g. Chapter 5 Problems" />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label>Description <span className="text-destructive">*</span></Label>
        <RichTextEditor
          value={description}
          onChange={(v: string) => setValue('description', v, { shouldValidate: true })}
          placeholder="Assignment instructions, requirements, hints…"
          className="min-h-[180px] rounded-lg border border-border"
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      {/* Group + Due Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Group <span className="text-destructive">*</span></Label>
          <Select
            value={watch('groupId')}
            onValueChange={(v) => setValue('groupId', v, { shouldValidate: true })}
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
          {errors.groupId && <p className="text-xs text-destructive">{errors.groupId.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due Date <span className="text-destructive">*</span></Label>
          <Input
            id="dueDate"
            type="datetime-local"
            {...register('dueDate')}
            min={new Date().toISOString().slice(0, 16)}
          />
          {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
        </div>
      </div>

      {/* Max Points */}
      <div className="space-y-1.5">
        <Label htmlFor="maxPoints">Max Points</Label>
        <Input
          id="maxPoints"
          type="number"
          min={1}
          max={1000}
          {...register('maxPoints', { valueAsNumber: true })}
          className="max-w-[160px]"
        />
        {errors.maxPoints && <p className="text-xs text-destructive">{errors.maxPoints.message}</p>}
      </div>

      {/* Allow Resubmit toggle */}
      <div className="flex items-center gap-3">
        <Switch
          id="allowResubmit"
          checked={allowResubmit}
          onCheckedChange={(v) => setValue('allowResubmit', v)}
        />
        <Label htmlFor="allowResubmit" className="cursor-pointer">
          Allow students to resubmit
        </Label>
      </div>

      {/* File attachments placeholder */}
      <div className="space-y-1.5">
        <Label>Attachments</Label>
        <div className="h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
          Attach files (PDF, images)
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMutation.isPending} className="min-w-[140px]">
          {createMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              Creating…
            </span>
          ) : 'Create Homework'}
        </Button>
      </div>
    </form>
  );
}
