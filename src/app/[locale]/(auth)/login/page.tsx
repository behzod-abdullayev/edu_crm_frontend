/**
 * Login page — /[locale]/login
 *
 * Server Component shell that:
 *  1. Exports generateMetadata() for SEO / robots control (Next.js 15 App Router)
 *  2. Renders the <LoginClient> client component inside <Suspense>
 *     (required because LoginClient calls useSearchParams)
 *
 * Architecture notes:
 *  - generateMetadata uses next-intl server helpers for locale-aware title
 *  - The actual form logic lives in LoginClient to keep this file a pure RSC
 *  - suppressHydrationWarning is NOT needed here (no theme-dependent SSR)
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LoginClient } from './LoginClient';

// ─── Props ────────────────────────────────────────────────────────────────────

interface LoginPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  // Validate locale — getTranslations throws if locale is invalid
  const t = await getTranslations({ locale, namespace: 'auth' });

  return {
    title: `${t('login')} | EduCRM`,
    description: t('loginSubtitle'),
    // Authentication pages must never be indexed
    robots: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
    },
    // No Open Graph for auth pages
    openGraph: undefined,
    twitter: undefined,
  };
}

// ─── Static params ────────────────────────────────────────────────────────────

export function generateStaticParams(): Array<{ locale: string }> {
  return [
    { locale: 'uz' },
    { locale: 'en' },
    { locale: 'ru' },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { locale } = await params;
  const { redirect, error } = await searchParams;

  // Enable static rendering for this locale + unlock next-intl server calls
  setRequestLocale(locale);

  return (
    /*
     * Suspense is required because <LoginClient> calls useSearchParams()
     * and useRouter() — both are only available in client components and
     * require a Suspense boundary per Next.js 15 rules.
     *
     * The fallback is a minimal full-screen skeleton that prevents CLS and
     * matches the real page dimensions so there's no layout shift on hydration.
     */
    <Suspense fallback={<LoginPageSkeleton />}>
      <LoginClient
        redirectTo={redirect}
        initialError={error}
        locale={locale}
      />
    </Suspense>
  );
}

// ─── Skeleton (Suspense fallback) ─────────────────────────────────────────────

function LoginPageSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading login page"
      className="flex min-h-dvh flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg-page)' }}
    >
      {/* Card skeleton */}
      <div
        className="w-full max-w-[400px] animate-pulse overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-8"
        style={{ boxShadow: 'var(--shadow-xl)' }}
      >
        {/* Logo placeholder */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-[var(--bg-surface-hover)]" />
          <div className="h-5 w-36 rounded bg-[var(--bg-surface-hover)]" />
          <div className="h-3.5 w-48 rounded bg-[var(--bg-surface-hover)]" />
        </div>

        {/* Email field skeleton */}
        <div className="mb-4 space-y-2">
          <div className="h-3 w-12 rounded bg-[var(--bg-surface-hover)]" />
          <div className="h-12 w-full rounded-lg bg-[var(--bg-surface-hover)]" />
        </div>

        {/* Password field skeleton */}
        <div className="mb-5 space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-16 rounded bg-[var(--bg-surface-hover)]" />
            <div className="h-3 w-24 rounded bg-[var(--bg-surface-hover)]" />
          </div>
          <div className="h-12 w-full rounded-lg bg-[var(--bg-surface-hover)]" />
        </div>

        {/* Remember me skeleton */}
        <div className="mb-5 flex items-center gap-3">
          <div className="h-4 w-4 rounded bg-[var(--bg-surface-hover)]" />
          <div className="h-3 w-20 rounded bg-[var(--bg-surface-hover)]" />
        </div>

        {/* Submit button skeleton */}
        <div className="h-13 w-full rounded-lg bg-[var(--brand-primary)] opacity-30" />
      </div>

      {/* Language switcher skeleton */}
      <div className="mt-5 flex gap-3">
        {(['UZ', 'EN', 'RU'] as const).map((lang) => (
          <div
            key={lang}
            className="h-8 w-10 rounded-md bg-[var(--bg-surface-hover)] animate-pulse"
          />
        ))}
      </div>

      {/* Shimmer keyframe — applied globally via globals.css shimmer class */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
