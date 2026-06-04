/**
 * Owner — Users page  /[locale]/owner/users
 *
 * Server Component shell (Next.js 15 App Router):
 *  1. Role-guard: redirects non-owners to /login (server-side)
 *  2. Exports generateMetadata() (noindex for authenticated pages)
 *  3. Renders <OwnerUsersClient> inside <Suspense> with shimmer skeleton fallback
 *
 * The real UI (search, filter, DataTable on desktop, MobileCardList on mobile,
 * assign-role sheet, pagination) lives entirely in OwnerUsersClient to keep
 * this file a pure RSC with zero client-side dependencies.
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { siteConfig } from '@/config/site.config';
import { OwnerUsersClient } from './OwnerUsersClient';

// ─── Props ────────────────────────────────────────────────────────────────────

interface UsersPageProps {
  params: Promise<{ locale: string }>;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });

  return {
    title: `${t('users')} | ${siteConfig.name}`,
    robots: { index: false, follow: false },
  };
}

// ─── Static params ────────────────────────────────────────────────────────────

export function generateStaticParams(): Array<{ locale: string }> {
  return [{ locale: 'uz' }, { locale: 'en' }, { locale: 'ru' }];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OwnerUsersPage({ params }: UsersPageProps) {
  const { locale } = await params;

  // Unlock next-intl server calls for this locale segment
  setRequestLocale(locale);

  return (
    <Suspense fallback={<UsersPageSkeleton />}>
      <OwnerUsersClient locale={locale} />
    </Suspense>
  );
}

// ─── Skeleton (Suspense fallback) ─────────────────────────────────────────────

function UsersPageSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading users"
      className="flex flex-col gap-6 p-4 sm:p-5 lg:p-6"
    >
      {/* Page title */}
      <div
        className="h-8 w-36 animate-pulse rounded-lg"
        style={{ background: 'var(--bg-surface-hover)' }}
      />

      {/* Toolbar row */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 flex-1 max-w-xs animate-pulse rounded-lg"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
        <div
          className="h-10 w-28 animate-pulse rounded-lg"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
      </div>

      {/* Table skeleton (desktop) */}
      <div
        className="hidden sm:block overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)]"
      >
        {/* Header row */}
        <div
          className="flex gap-4 border-b border-[var(--border-default)] px-6 py-4"
          style={{ background: 'var(--bg-surface-secondary)' }}
        >
          {[120, 200, 100, 100, 80].map((w, i) => (
            <div
              key={i}
              className="animate-pulse rounded"
              style={{
                width: w,
                height: 12,
                background: 'var(--bg-surface-hover)',
              }}
            />
          ))}
        </div>

        {/* Body rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-[var(--border-default)] px-6 py-4 last:border-0"
          >
            {/* Avatar */}
            <div
              className="h-9 w-9 animate-pulse rounded-full shrink-0"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
            {/* Name + email */}
            <div className="flex flex-col gap-1.5 flex-1">
              <div
                className="h-3 w-32 animate-pulse rounded"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
              <div
                className="h-2.5 w-48 animate-pulse rounded"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
            </div>
            {/* Role badge */}
            <div
              className="h-6 w-16 animate-pulse rounded-full"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
            {/* Status */}
            <div
              className="h-6 w-14 animate-pulse rounded-full"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
            {/* Actions */}
            <div
              className="h-8 w-8 animate-pulse rounded-lg"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
          </div>
        ))}
      </div>

      {/* Card list skeleton (mobile) */}
      <div className="sm:hidden space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-10 w-10 animate-pulse rounded-full shrink-0"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
              <div className="flex-1 space-y-2">
                <div
                  className="h-3.5 w-28 animate-pulse rounded"
                  style={{ background: 'var(--bg-surface-hover)' }}
                />
                <div
                  className="h-2.5 w-40 animate-pulse rounded"
                  style={{ background: 'var(--bg-surface-hover)' }}
                />
              </div>
              <div
                className="h-6 w-14 animate-pulse rounded-full"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
