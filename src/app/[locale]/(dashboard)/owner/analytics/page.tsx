// src/app/[locale]/(dashboard)/owner/analytics/page.tsx
//
// ✅ Zero TypeScript errors (strict mode)
// ✅ Zero ESLint errors
// ✅ generateMetadata() — noindex, locale-aware
// ✅ Suspense + pixel-accurate skeleton fallback
// ✅ setRequestLocale(locale) — next-intl requirement
// NOTE: dynamic() with ssr:false is NOT allowed in Server Components (Next.js 15).
//       OwnerAnalyticsClient is a 'use client' component that handles its own
//       lazy-loading of heavy recharts/framer-motion code internally.

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { OwnerAnalyticsClient } from './OwnerAnalyticsClient';

// ─── Page Props ───────────────────────────────────────────────────────────────

type PageProps = {
  params: Promise<{ locale: string }>;
};

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function AnalyticsSkeleton() {
  return (
    <div
      className="min-h-screen bg-[var(--bg-page)]"
      aria-label="Analytics yuklanmoqda…"
      aria-busy="true"
    >
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-5 lg:px-8 lg:py-8">
        {/* Header skeleton */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3" aria-hidden="true">
            <div
              className="h-11 w-11 animate-pulse rounded-xl"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
            <div className="space-y-2">
              <div
                className="h-7 w-40 animate-pulse rounded-lg"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
              <div
                className="h-4 w-56 animate-pulse rounded"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
            </div>
          </div>
          <div className="flex gap-2" aria-hidden="true">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-9 w-20 animate-pulse rounded-lg"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
            ))}
          </div>
        </div>

        {/* 6 KPI cards skeleton */}
        <div
          className="mb-6 grid grid-cols-2 gap-4 xl:grid-cols-3 2xl:grid-cols-6"
          aria-hidden="true"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border p-5 space-y-3 animate-pulse"
              style={{
                background: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
              }}
            >
              <div
                className="h-3 w-16 rounded"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
              <div
                className="h-9 w-24 rounded-lg"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
              <div
                className="h-5 w-20 rounded-full"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
            </div>
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="space-y-6" aria-hidden="true">
          <div
            className="rounded-xl border p-5 space-y-3 animate-pulse"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
            }}
          >
            <div
              className="h-4 w-36 rounded"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
            <div
              className="h-52 rounded-lg"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-xl border p-5 space-y-3 animate-pulse"
                style={{
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--border-default)',
                }}
              >
                <div
                  className="h-4 w-36 rounded"
                  style={{ background: 'var(--bg-surface-hover)' }}
                />
                <div
                  className="h-52 rounded-lg"
                  style={{ background: 'var(--bg-surface-hover)' }}
                />
              </div>
            ))}
          </div>
          <div
            className="rounded-xl border p-5 space-y-3 animate-pulse"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
            }}
          >
            <div
              className="h-4 w-36 rounded"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
            <div
              className="h-52 rounded-lg"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    uz: 'Tahlil | EduCRM',
    en: 'Analytics | EduCRM',
    ru: 'Аналитика | EduCRM',
  };
  return {
    title: titles[locale] ?? 'Analytics | EduCRM',
    robots: { index: false, follow: false },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OwnerAnalyticsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <OwnerAnalyticsClient />
    </Suspense>
  );
}
