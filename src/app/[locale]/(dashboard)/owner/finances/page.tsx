// src/app/[locale]/(dashboard)/owner/finances/page.tsx
//
// ✅ Zero TypeScript errors (strict mode)
// ✅ generateMetadata() — noindex
// ✅ Suspense + skeleton fallback (shimmer, NOT animate-pulse — XATO №9 fix)
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
  const t = await getTranslations({ locale, namespace: 'owner.finances' });
  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

// ── XATO №9 fix: shimmer class ishlatiladi, animate-pulse emas ───────────────

function FinancesSkeleton() {
  return (
    <div
      className="space-y-8 p-4 pb-8 sm:p-6"
      aria-label="Loading finances…"
      aria-busy="true"
    >
      {/* Heading */}
      <div className="space-y-2" aria-hidden="true">
        <div
          className="shimmer h-8 w-56 rounded-xl"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
        <div
          className="shimmer h-4 w-80 rounded-lg"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
      </div>

      {/* 6 KPI cards — XATO №3 fix: 6 ta karta skeletoni */}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-6"
        aria-hidden="true"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border p-5 space-y-3"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
            }}
          >
            <div className="flex items-start justify-between">
              <div
                className="shimmer h-11 w-11 rounded-xl"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
              <div
                className="shimmer h-5 w-14 rounded-full"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
            </div>
            <div className="space-y-1.5">
              <div
                className="shimmer h-3 w-20 rounded"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
              <div
                className="shimmer h-8 w-28 rounded-lg"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
              <div
                className="shimmer h-3 w-16 rounded"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
            </div>
            <div
              className="shimmer h-10 w-full rounded"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3" aria-hidden="true">
        <div
          className="shimmer lg:col-span-2 h-72 rounded-xl"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
        <div
          className="shimmer h-72 rounded-xl"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
      </div>

      {/* Table skeleton */}
      <div
        className="rounded-xl border"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
        aria-hidden="true"
      >
        {/* Table header */}
        <div
          className="flex items-center justify-between border-b p-4"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div
            className="shimmer h-5 w-40 rounded"
            style={{ background: 'var(--bg-surface-hover)' }}
          />
          <div
            className="shimmer h-8 w-28 rounded-lg"
            style={{ background: 'var(--bg-surface-hover)' }}
          />
        </div>
        {/* Table rows */}
        <div className="p-4 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="shimmer h-12 rounded-lg"
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