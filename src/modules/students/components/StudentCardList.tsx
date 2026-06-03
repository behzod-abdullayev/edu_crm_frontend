'use client';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Badge } from '@shared/components/ui/badge';
import { cn } from '@shared/lib/utils';
import type { StudentListDto } from './StudentTable';

interface StudentCardProps {
  student: StudentListDto;
  basePath?: string | undefined;
  onDelete?: ((id: string) => void) | undefined;
  className?: string | undefined;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

function getFullName(s: StudentListDto): string {
  return `${s.firstName} ${s.lastName}`.trim();
}

export function StudentCard({ student, basePath = '/teacher/students', onDelete, className }: StudentCardProps) {
  const rate = student.attendanceRate ?? 0;
  const grade = student.averageGrade ?? 0;
  const fullName = getFullName(student);

  return (
    <div className={cn('relative', className)}>
      <Link href={`${basePath}/${student.id}`} className="block">
        <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors">
          <Avatar className="w-12 h-12 flex-shrink-0">
            <AvatarImage src={student.avatarUrl ?? undefined} alt={fullName} />
            <AvatarFallback>{getInitials(student.firstName, student.lastName)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-sm truncate">{fullName}</p>
              <Badge variant={student.status === 'active' ? 'default' : 'outline'} className="capitalize text-xs flex-shrink-0">
                {student.status ?? 'active'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{student.email}</p>
            {student.groupName !== undefined && student.groupName !== null && (
              <p className="text-xs text-muted-foreground">{student.groupName}</p>
            )}
            <div className="flex items-center gap-3 pt-0.5">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-14 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">{rate}%</span>
              </div>
              <span className={cn(
                'text-xs font-medium tabular-nums',
                grade >= 80 ? 'text-green-600' : grade >= 60 ? 'text-amber-600' : 'text-red-600',
              )}>
                {grade.toFixed(1)} avg
              </span>
            </div>
          </div>
        </div>
      </Link>
      {onDelete !== undefined && (
        <button
          onClick={() => onDelete(student.id)}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          aria-label={`Remove ${fullName}`}
        >
          ×
        </button>
      )}
    </div>
  );
}

interface StudentCardListProps {
  students: StudentListDto[];
  isLoading?: boolean | undefined;
  totalCount?: number | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
  onPageChange?: ((page: number) => void) | undefined;
  basePath?: string | undefined;
  onDelete?: ((id: string) => void) | undefined;
}

export function StudentCardList({
  students,
  isLoading,
  totalCount = 0,
  page = 1,
  pageSize = 20,
  onPageChange,
  basePath,
  onDelete,
}: StudentCardListProps) {
  if (isLoading === true) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-2">
        <p className="text-muted-foreground font-medium">No students found</p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-3">
      {students.map((student) => (
        <StudentCard
          key={student.id}
          student={student}
          basePath={basePath}
          onDelete={onDelete}
        />
      ))}
      {totalPages > 1 && onPageChange !== undefined && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 text-sm rounded-lg border border-border disabled:opacity-40"
          >
            Prev
          </button>
          <span className="px-4 py-2 text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm rounded-lg border border-border disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}