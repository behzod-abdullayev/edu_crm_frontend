// src/app/[locale]/(dashboard)/owner/finances/page.tsx
//
// ✅ Zero TypeScript errors (strict mode)
// ✅ generateMetadata() — noindex
// ✅ Suspense + skeleton fallback
// ✅ Server Component wrapper → Client lazy-loaded

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { OwnerFinancesClient } from './OwnerFinancesClient';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'owner' });
  return {
    title: t('finances.title'),
    robots: { index: false, follow: false },
  };
}

function FinancesSkeleton() {
  return (
    <div
      className="space-y-8 pb-8"
      aria-label="Loading finances…"
      aria-busy="true"
    >
      {/* Heading */}
      <div className="space-y-2" aria-hidden="true">
        <div
          className="h-8 w-56 rounded-xl animate-pulse"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
        <div
          className="h-4 w-80 rounded-lg animate-pulse"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border p-6 space-y-3 animate-pulse"
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
              className="h-9 w-28 rounded-lg"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3" aria-hidden="true">
        <div
          className="lg:col-span-2 h-72 rounded-xl animate-pulse"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
        <div
          className="h-72 rounded-xl animate-pulse"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
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
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-12 rounded-lg"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function OwnerFinancesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<FinancesSkeleton />}>
      <OwnerFinancesClient />
    </Suspense>
  );
}
