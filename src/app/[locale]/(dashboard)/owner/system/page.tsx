// src/app/[locale]/(dashboard)/owner/system/page.tsx
//
// ✅ Zero TypeScript errors (strict mode)
// ✅ generateMetadata() — noindex
// ✅ Suspense + pixel-accurate skeleton
// ✅ setRequestLocale correctly called

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { OwnerSystemClient } from './OwnerSystemClient';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'owner' });
  return {
    title: t('system', { fallback: 'System — Owner — EduCRM' }),
    robots: { index: false, follow: false },
  };
}

function SystemSkeleton() {
  return (
    <div
      className="space-y-8 pb-8"
      aria-label="Loading system settings…"
      aria-busy="true"
    >
      {/* Heading */}
      <div className="space-y-2" aria-hidden="true">
        <div
          className="h-8 w-52 rounded-xl animate-pulse"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
        <div
          className="h-4 w-72 rounded-lg animate-pulse"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
      </div>

      {/* Health cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border p-4 space-y-2 animate-pulse"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
            }}
          >
            <div
              className="h-3 w-20 rounded"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
              <div
                className="h-4 w-16 rounded"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Sections */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border p-6 space-y-4 animate-pulse"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--border-default)',
          }}
          aria-hidden="true"
        >
          <div
            className="h-4 w-40 rounded"
            style={{ background: 'var(--bg-surface-hover)' }}
          />
          <div
            className="h-16 rounded-lg"
            style={{ background: 'var(--bg-surface-hover)' }}
          />
        </div>
      ))}
    </div>
  );
}

export default async function OwnerSystemPage({ params }: PageProps) {
  const { locale } = await params;
  const { setRequestLocale } = await import('next-intl/server');
  setRequestLocale(locale);

  return (
    <Suspense fallback={<SystemSkeleton />}>
      <OwnerSystemClient />
    </Suspense>
  );
}
