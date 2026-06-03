'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import { CourseCard } from './CourseCard';
import { useStudentCourses } from '@/modules/students/hooks/useStudentCourses';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { useDebounce } from '@shared/hooks/useDebounce';
import { cn } from '@shared/lib/utils';
import type { CourseListParams } from '../types/course.types';

const STATUS_FILTERS: { label: string; value: CourseListParams['status'] }[] = [
  { label: 'All', value: 'all' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
];

export function CourseList() {
  const currentUserQuery = useCurrentUser();
  const userId = currentUserQuery.data?.id;
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CourseListParams['status']>('all');
  const debouncedSearch = useDebounce(search, 350);

  const params: Partial<CourseListParams> = {
    page: 1,
    pageSize: 50,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status ? { status } : {}),
  };

  const { data, isLoading, isFetching } = useStudentCourses(userId ?? '', params);

  const courses = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={status === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus(f.value)}
              className="flex-shrink-0"
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-56 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-2">
          <p className="text-muted-foreground font-medium">No courses found</p>
          <p className="text-sm text-muted-foreground">
            {search ? 'Try a different search term.' : "You haven't enrolled in any courses yet."}
          </p>
        </div>
      ) : (
        <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', isFetching && 'opacity-70 transition-opacity')}>
          {courses.map((enrollment) => {
            const progressPercent = enrollment.progressPercent ?? 0;
            return (
              <CourseCard
                key={enrollment.courseId}
                course={{
                  id: enrollment.courseId,
                  name: enrollment.courseName,
                  ...(enrollment.thumbnailUrl !== undefined ? { thumbnailUrl: enrollment.thumbnailUrl } : {}),
                  ...(enrollment.level !== undefined ? { level: enrollment.level } : {}),
                  enrollmentCount: 0,
                  ...(enrollment.lessonCount !== undefined ? { lessonCount: enrollment.lessonCount } : {}),
                }}
                href={`/student/courses/${enrollment.courseId}`}
                showProgress
                progressPercent={progressPercent}
                {...(enrollment.nextLessonTitle ? { nextLessonTitle: enrollment.nextLessonTitle } : {})}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}