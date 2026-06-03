'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Users, ChevronRight } from 'lucide-react';
import { Badge } from '@shared/components/ui/badge';
import { cn } from '@shared/lib/utils';

// Local CourseCardData type with all fields needed by the card
export interface CourseCardData {
  id: string;
  name: string;
  description?: string;
  thumbnailUrl?: string | null;
  thumbnailKey?: string | null;
  level?: 'beginner' | 'intermediate' | 'advanced';
  enrollmentCount?: number;
  lessonCount?: number;
  status?: string;
  teacherId?: string;
  teacherName?: string;
}

interface CourseCardProps {
  course: CourseCardData;
  href?: string;
  showProgress?: boolean;
  progressPercent?: number;
  nextLessonTitle?: string;
  className?: string;
}

export function CourseCard({
  course,
  href,
  showProgress,
  progressPercent = 0,
  nextLessonTitle,
  className,
}: CourseCardProps) {
  const cardHref = href ?? `/student/courses/${course.id}`;

  return (
    <Link href={cardHref} className="block group">
      <div
        className={cn(
          'rounded-xl border border-border bg-card overflow-hidden',
          'hover:border-primary/40 hover:shadow-md transition-all duration-300',
          'animate-in fade-in slide-in-from-bottom-2 duration-400',
          className,
        )}
      >
        {/* Thumbnail */}
        <div className="relative h-36 bg-muted overflow-hidden">
          {course.thumbnailUrl ? (
            <Image
              src={course.thumbnailUrl}
              alt={course.name ?? ''}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <BookOpen className="w-10 h-10 text-primary/30" />
            </div>
          )}
          {course.level && (
            <div className="absolute top-2 left-2">
              <Badge variant="outline" className="capitalize text-xs">
                {course.level}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 flex-1 group-hover:text-primary transition-colors">
              {course.name}
            </h3>
            <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {course.enrollmentCount !== undefined && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {course.enrollmentCount}
              </span>
            )}
            {course.lessonCount !== undefined && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {course.lessonCount} lessons
              </span>
            )}
          </div>

          {showProgress && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{nextLessonTitle ? `Next: ${nextLessonTitle}` : 'Progress'}</span>
                <span className="font-medium tabular-nums">{progressPercent}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
