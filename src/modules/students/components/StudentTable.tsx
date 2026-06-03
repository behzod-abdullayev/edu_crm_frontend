'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import Link from 'next/link';

// Local StudentListDto that extends Student with computed display fields
export interface StudentListDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  status?: string;
  groupName?: string;
  attendanceRate?: number;
  averageGrade?: number;
}

interface StudentTableProps {
  data: StudentListDto[];
  isLoading?: boolean;
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  basePath?: string;
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

function getFullName(s: StudentListDto): string {
  return `${s.firstName} ${s.lastName}`.trim();
}

function StudentRow({ s, basePath }: { s: StudentListDto; basePath: string }) {
  const rate = s.attendanceRate ?? 0;
  const grade = s.averageGrade ?? 0;
  const fullName = getFullName(s);
  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={s.avatarUrl ?? undefined} alt={fullName} />
            <AvatarFallback className="text-xs">{getInitials(s.firstName, s.lastName)}</AvatarFallback>
          </Avatar>
          <div>
            <Link href={`${basePath}/${s.id}`} className="font-medium text-sm hover:underline text-foreground">
              {fullName}
            </Link>
            <p className="text-xs text-muted-foreground">{s.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-muted-foreground">{s.groupName ?? '—'}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
          </div>
          <span className="text-sm tabular-nums">{rate}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <Badge
          variant="outline"
          className={grade >= 80 ? 'border-green-500 text-green-600' : grade >= 60 ? 'border-amber-500 text-amber-600' : 'border-red-500 text-red-600'}
        >
          {grade.toFixed(1)}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <Badge variant={s.status === 'active' ? 'default' : 'outline'} className="capitalize">
          {s.status ?? 'active'}
        </Badge>
      </td>
    </tr>
  );
}

export function StudentTable({
  data,
  isLoading,
  totalCount,
  page,
  pageSize,
  onPageChange,
  basePath = '/teacher/students',
}: StudentTableProps) {
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {['Student', 'Group', 'Attendance', 'Avg. Grade', 'Status'].map((h) => (
              <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-muted animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            : data.map((s) => <StudentRow key={s.id} s={s} basePath={basePath} />)}
        </tbody>
      </table>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages} · {totalCount} students
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Prev</Button>
            <Button size="sm" variant="outline" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
