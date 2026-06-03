'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { httpClient } from '@/services/api/axios.instance';
import { CourseCard, type CourseCardData } from '@/modules/courses/components/CourseCard';
import { useAuth } from '@/modules/auth/hooks/useAuth';

interface EnrolledCourseDto {
  id: string;
  name: string;
  description?: string;
  teacherId?: string;
  totalLessons?: number;
  completedLessons?: number;
  thumbnailUrl?: string;
  status?: string;
}

const FILTER_TABS = ['All', 'Active', 'Completed'] as const;
type FilterTab = (typeof FILTER_TABS)[number];

export function StudentCoursesClient() {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [search, setSearch] = useState('');

  const { data: courses = [], isLoading } = useQuery<EnrolledCourseDto[]>({
    queryKey: ['student', user?.id, 'courses'],
    queryFn: async () => {
      const res = await httpClient.get<EnrolledCourseDto[]>(`/students/${user?.id ?? ''}/courses`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  const filtered = courses.filter((c) => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Active' && c.status === 'active') ||
      (activeFilter === 'Completed' && c.status === 'completed');
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
        <p className="text-sm text-muted-foreground">
          {courses.length} enrolled course{courses.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          placeholder="Search courses…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring sm:w-60"
        />
        <div className="flex gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              type="button"
              className={[
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                activeFilter === tab
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border text-muted-foreground hover:bg-muted',
              ].join(' ')}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-xl bg-muted" aria-hidden />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
          <div className="text-4xl" aria-hidden>
            📚
          </div>
          <p className="font-semibold text-foreground">No courses found</p>
          <p className="text-sm text-muted-foreground">
            {search ? 'Try a different search term.' : 'You have not enrolled in any courses yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((dto) => {
            const course: CourseCardData = {
              id: dto.id,
              name: dto.name,
              ...(dto.description !== undefined && { description: dto.description }),
              thumbnailUrl: dto.thumbnailUrl ?? null,
              ...(dto.totalLessons !== undefined && { lessonCount: dto.totalLessons }),
              ...(dto.status !== undefined && { status: dto.status }),
            };
            const total = dto.totalLessons ?? 0;
            const done = dto.completedLessons ?? 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <CourseCard
                key={dto.id}
                course={course}
                href={`/student/courses/${dto.id}`}
                showProgress
                progressPercent={pct}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
