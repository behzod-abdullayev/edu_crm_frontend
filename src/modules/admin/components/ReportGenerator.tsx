'use client';

import { useState } from 'react';
import { ReportRequest, ReportRecord, ReportType } from '../types/admin.types';

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  {
    value: 'attendance',
    label: 'Attendance Report',
    description: 'Student attendance rates by group, teacher, and date range',
  },
  {
    value: 'financial',
    label: 'Financial Report',
    description: 'Revenue, invoices, payments, and outstanding debts',
  },
  {
    value: 'performance',
    label: 'Performance Report',
    description: 'Student grades, test scores, and course completion rates',
  },
];

const EXPORT_FORMATS = ['PDF', 'CSV', 'Excel'] as const;
type ExportFormat = (typeof EXPORT_FORMATS)[number];

interface ReportGeneratorProps {
  recentReports: ReportRecord[];
  courses: { id: string; name: string }[];
  teachers: { id: string; name: string }[];
  onGenerate: (request: ReportRequest, format: ExportFormat) => Promise<void>;
}

export function ReportGenerator({
  recentReports,
  courses,
  teachers,
  onGenerate,
}: ReportGeneratorProps) {
  const [type, setType] = useState<ReportType>('attendance');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [courseId, setCourseId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [format, setFormat] = useState<ExportFormat>('PDF');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      setError('Please select a date range');
      return;
    }
    setError(null);
    setIsGenerating(true);
    try {
      await onGenerate(
        {
          type,
          startDate,
          endDate,
          ...(courseId ? { courseId } : {}),
          ...(teacherId ? { teacherId } : {}),
        },
        format
      );
    } catch {
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Report type selector */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Report Type</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {REPORT_TYPES.map((rt) => (
            <button
              key={rt.value}
              onClick={() => setType(rt.value)}
              className={[
                'rounded-xl border p-4 text-left transition-all',
                type === rt.value
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border bg-card hover:border-primary/50',
              ].join(' ')}
              type="button"
            >
              <p className="font-medium text-foreground">{rt.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{rt.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Course (optional)</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Teacher (optional)</label>
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Teachers</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Format + Generate */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-border">
          {EXPORT_FORMATS.map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={[
                'px-4 py-2 text-sm font-medium transition-colors first:rounded-l-lg last:rounded-r-lg',
                format === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              ].join(' ')}
              type="button"
            >
              {f}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          type="button"
        >
          {isGenerating ? 'Generating…' : `Generate ${format}`}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Recent reports */}
      {recentReports.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold text-foreground">Recent Reports</h3>
          <div className="rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {['Name', 'Type', 'Generated', 'By', 'Download'].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium text-foreground">{report.name}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{report.type}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {new Date(report.generatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{report.generatedBy}</td>
                    <td className="px-4 py-3">
                      <a
                        href={report.url}
                        download
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
