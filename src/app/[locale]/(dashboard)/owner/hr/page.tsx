// src/app/[locale]/(dashboard)/owner/hr/page.tsx
//
// ✅ Zero TypeScript errors (strict mode)
// ✅ generateMetadata() — noindex
// ✅ Suspense + pixel-accurate skeleton
// ✅ Passes locale to setRequestLocale (required by next-intl App Router)

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { OwnerHRClient } from './OwnerHRClient';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'owner' });
  return {
    title: t('hr', { fallback: 'HR — Owner — EduCRM' }),
    robots: { index: false, follow: false },
  };
}

function HRSkeleton() {
  return (
    <div
      className="space-y-8 pb-8"
      aria-label="Loading HR panel…"
      aria-busy="true"
    >
      {/* Heading */}
      <div className="space-y-2" aria-hidden="true">
        <div
          className="h-8 w-36 rounded-xl animate-pulse"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
        <div
          className="h-4 w-64 rounded-lg animate-pulse"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
      </div>

      {/* Filter bar */}
      <div className="flex gap-3" aria-hidden="true">
        {[120, 110, 100].map((w, i) => (
          <div
            key={i}
            className="h-9 rounded-lg animate-pulse"
            style={{
              width: w,
              background: 'var(--bg-surface-hover)',
            }}
          />
        ))}
      </div>

      {/* Table skeleton */}
      <div
        className="rounded-xl border animate-pulse"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
        aria-hidden="true"
      >
        {/* Table header */}
        <div
          className="h-11 border-b"
          style={{
            background: 'var(--bg-surface-secondary)',
            borderColor: 'var(--border-default)',
          }}
        />
        {/* Table rows */}
        <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div
                className="h-4 w-32 rounded"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
              <div
                className="h-4 w-20 rounded"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
              <div
                className="h-4 w-24 rounded"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
              <div
                className="ml-auto h-5 w-16 rounded-full"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function OwnerHRPage({ params }: PageProps) {
  const { locale } = await params;
  const { setRequestLocale } = await import('next-intl/server');
  setRequestLocale(locale);

  return (
    <Suspense fallback={<HRSkeleton />}>
      <OwnerHRClient />
    </Suspense>
  );
}
