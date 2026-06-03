'use client';

import { useEffect, useState } from 'react';
import { useAdminReports } from '@/modules/admin/hooks/useAdmin';
import { ReportGenerator } from '@/modules/admin/components/ReportGenerator';
import { ReportRequest } from '@/modules/admin/types/admin.types';

type ExportFormat = 'PDF' | 'CSV' | 'Excel';

export function AdminReportsClient() {
  const { recentReports, isLoading, generateReport } = useAdminReports();

  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/courses?fields=id,name').then((r) => r.json()),
      fetch('/api/admin/teachers?fields=id,name').then((r) => r.json()),
    ]).then(([c, t]) => {
      setCourses(c as { id: string; name: string }[]);
      setTeachers(t as { id: string; name: string }[]);
    });
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate attendance, financial, and performance reports
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-48 animate-pulse rounded-xl bg-muted" />
          <div className="h-12 animate-pulse rounded-lg bg-muted" />
        </div>
      ) : (
        <ReportGenerator
          recentReports={recentReports}
          courses={courses}
          teachers={teachers}
          onGenerate={(request: ReportRequest, format: ExportFormat) =>
            generateReport(request, format)
          }
        />
      )}
    </div>
  );
}
