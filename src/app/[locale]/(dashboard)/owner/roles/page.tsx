// src/app/[locale]/(dashboard)/owner/roles/page.tsx
//
// ✅ Zero TypeScript errors (strict mode)
// ✅ generateMetadata() — noindex
// ✅ Suspense + pixel-accurate skeleton for permission matrix
// ✅ setRequestLocale called correctly

import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { OwnerRolesClient } from './OwnerRolesClient';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'owner' });
  return {
    title: t('roles.title'),
    robots: { index: false, follow: false },
  };
}

function RolesSkeleton() {
  return (
    <div
      className="space-y-8 pb-8"
      aria-label="Loading roles & permissions…"
      aria-busy="true"
    >
      {/* Heading */}
      <div className="space-y-2" aria-hidden="true">
        <div
          className="h-8 w-60 rounded-xl animate-pulse"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
        <div
          className="h-4 w-80 rounded-lg animate-pulse"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
      </div>

      {/* Role cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border p-5 space-y-3 animate-pulse"
            style={{
              background: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
            }}
          >
            <div
              className="h-9 w-9 rounded-xl"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
            <div
              className="h-4 w-24 rounded"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
            <div
              className="h-3 w-16 rounded"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
          </div>
        ))}
      </div>

      {/* Permission matrix skeleton */}
      <div
        className="rounded-xl border animate-pulse"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border-default)',
        }}
        aria-hidden="true"
      >
        {/* Header row */}
        <div
          className="h-12 border-b"
          style={{
            background: 'var(--bg-surface-secondary)',
            borderColor: 'var(--border-default)',
          }}
        />
        {/* Category rows */}
        {Array.from({ length: 6 }).map((_, ci) => (
          <div key={ci}>
            <div
              className="h-8 border-b px-4 flex items-center"
              style={{
                background: 'var(--bg-surface-hover)',
                borderColor: 'var(--border-default)',
              }}
            >
              <div
                className="h-3 w-20 rounded-full"
                style={{ background: 'var(--border-default)' }}
              />
            </div>
            {Array.from({ length: 3 }).map((_, ri) => (
              <div
                key={ri}
                className="h-12 border-b flex items-center gap-4 px-4"
                style={{ borderColor: 'var(--border-default)' }}
              >
                <div
                  className="h-3 w-36 rounded"
                  style={{ background: 'var(--bg-surface-hover)' }}
                />
                {Array.from({ length: 4 }).map((__, ti) => (
                  <div
                    key={ti}
                    className="ml-auto h-5 w-5 rounded"
                    style={{ background: 'var(--bg-surface-hover)' }}
                  />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function OwnerRolesPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<RolesSkeleton />}>
      <OwnerRolesClient />
    </Suspense>
  );
}
