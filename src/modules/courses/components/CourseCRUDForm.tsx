'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { httpClient } from '@/services/api/axios.instance';
import { useToast } from '@shared/hooks/useToast';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/components/ui/select';
import { Switch } from '@shared/components/ui/switch';
import { parseApiError } from '@shared/utils/api-error';
import { mapCourseDtoToForm, mapCourseFormToDto, type CourseDto } from '../utils/course.mapper';
import type { CourseFormValues } from '../types/course.types';

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().min(1, 'Description is required'),
  thumbnailKey: z.string().nullable(),
  categoryId: z.string().min(1, 'Category is required'),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  isPublished: z.boolean(),
});

interface CourseCRUDFormProps {
  course?: CourseDto;
  onSuccess?: () => void;
}

export function CourseCRUDForm({ course, onSuccess }: CourseCRUDFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();
  const isEdit = !!course;

  const saveMutation = useMutation({
    mutationFn: async (values: CourseFormValues) => {
      const dto = mapCourseFormToDto(values);
      if (isEdit) {
        const res = await httpClient.patch<CourseDto>(`/courses/${course.id}`, dto);
        return res.data;
      } else {
        const res = await httpClient.post<CourseDto>('/courses', dto);
        return res.data;
      }
    },
    onSuccess: () => {
      toast({ title: isEdit ? 'Course updated' : 'Course created' });
      void queryClient.invalidateQueries({ queryKey: ['courses'] });
      onSuccess?.();
      if (!isEdit) router.push('/teacher/groups');
    },
    onError: () => {
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} course`);
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    reset,
    formState: { errors, isDirty },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: course ? mapCourseDtoToForm(course) : {
      name: '',
      description: '',
      thumbnailKey: null,
      categoryId: '',
      level: 'beginner',
      isPublished: false,
    },
  });

  useEffect(() => {
    if (course) reset(mapCourseDtoToForm(course));
  }, [course, reset]);

  const isPublished = watch('isPublished');

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveMutation.mutateAsync(values);
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      Object.entries(parsed.errors).forEach(([field, messages]) => {
        const message = Array.isArray(messages) ? (messages[0] ?? '') : String(messages);
        setError(field as keyof CourseFormValues, { type: 'server', message });
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="space-y-1.5">
        <Label>Course Thumbnail</Label>
        <div className="h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-sm">
          Upload thumbnail
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="courseName">Course Name <span className="text-destructive">*</span></Label>
        <Input id="courseName" {...register('name')} placeholder="e.g. Advanced Mathematics" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="courseDescription">Description <span className="text-destructive">*</span></Label>
        <textarea
          id="courseDescription"
          {...register('description')}
          placeholder="What will students learn?"
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Level</Label>
          <Select
            value={watch('level')}
            onValueChange={(v) => setValue('level', v as CourseFormValues['level'], { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="categoryId">Category <span className="text-destructive">*</span></Label>
          <Input id="categoryId" {...register('categoryId')} placeholder="e.g. Mathematics" />
          {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="isPublished"
          checked={isPublished}
          onCheckedChange={(v) => setValue('isPublished', v, { shouldDirty: true })}
        />
        <Label htmlFor="isPublished" className="cursor-pointer">
          {isPublished ? 'Published (visible to students)' : 'Draft (not visible to students)'}
        </Label>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={saveMutation.isPending || (!isDirty && isEdit)} className="min-w-[120px]">
          {saveMutation.isPending ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
              Saving…
            </span>
          ) : isEdit ? 'Save Changes' : 'Create Course'}
        </Button>
      </div>
    </form>
  );
}