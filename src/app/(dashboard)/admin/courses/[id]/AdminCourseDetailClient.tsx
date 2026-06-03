'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { can } from '@/lib/permissions';
import { CourseDto, CourseStatus } from '@/modules/admin/types/admin.types';

interface Module {
  id: string;
  title: string;
  order: number;
  lessonCount: number;
}

interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  enrolledAt: string;
  attendancePercent: number;
}

interface CourseDetailData extends CourseDto {
  modules: Module[];
  enrolledStudents: EnrolledStudent[];
  description: string;
}

interface AdminCourseDetailClientProps {
  courseId: string;
  startInEditMode: boolean;
}

export function AdminCourseDetailClient({
  courseId,
  startInEditMode,
}: AdminCourseDetailClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'modules' | 'students'>('overview');

  useEffect(() => {
    fetch(`/api/admin/courses/${courseId}`)
      .then((r) => r.json() as Promise<CourseDetailData>)
      .then(setCourse)
      .finally(() => setIsLoading(false));
  }, [courseId]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-96 items-center justify-center p-6">
        <p className="text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  const STATUS_COLORS: Record<CourseStatus, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    draft: 'bg-muted text-muted-foreground',
    archived: 'bg-gray-100 text-gray-600',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-3 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          type="button"
        >
          ← Back to Courses
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{course.name}</h1>
              <span className={[
                'rounded-full px-2 py-0.5 text-xs font-medium capitalize',
                STATUS_COLORS[course.status],
              ].join(' ')}>
                {course.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {course.teacherName} · {course.studentsEnrolled} students enrolled
            </p>
          </div>
          {can(user, 'course.update') && (
            <button
              onClick={() => router.push(`/admin/courses/${courseId}?edit=1`)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
              type="button"
            >
              Edit Course
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {(['overview', 'modules', 'students'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={[
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            ].join(' ')}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Description</h3>
              <p className="text-sm text-muted-foreground">{course.description}</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Teacher', value: course.teacherName },
              { label: 'Price', value: `${course.price} ${course.currency}` },
              { label: 'Start Date', value: new Date(course.startDate).toLocaleDateString() },
              { label: 'End Date', value: course.endDate ? new Date(course.endDate).toLocaleDateString() : 'Ongoing' },
              { label: 'Students', value: String(course.studentsEnrolled) },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 font-medium text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modules */}
      {activeTab === 'modules' && (
        <div className="space-y-3">
          {can(user, 'course.update') && (
            <div className="flex justify-end">
              <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground" type="button">
                + Add Module
              </button>
            </div>
          )}
          {course.modules.map((mod) => (
            <div key={mod.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
              <div>
                <p className="font-medium text-foreground">{mod.title}</p>
                <p className="text-xs text-muted-foreground">{mod.lessonCount} lessons</p>
              </div>
              <div className="flex gap-2">
                {can(user, 'course.update') && (
                  <button className="text-xs text-primary hover:underline" type="button">Edit</button>
                )}
                {can(user, 'course.delete') && (
                  <button className="text-xs text-red-600 hover:underline" type="button">Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Students */}
      {activeTab === 'students' && (
        <div className="rounded-xl border border-border">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">{course.enrolledStudents.length} enrolled</p>
            {can(user, 'course.update') && (
              <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground" type="button">
                + Enroll Student
              </button>
            )}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {['Student', 'Email', 'Enrolled', 'Attendance'].map((col) => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {course.enrolledStudents.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {new Date(s.enrolledAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${s.attendancePercent}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-muted-foreground">{s.attendancePercent}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
