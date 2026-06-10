/**
 * Owner — Users page  /[locale]/owner/users
 *
 * Server Component shell (Next.js 15 App Router):
 *  1. Role-guard: server-side cookie check — non-owners redirect to /login
 *     FIX XATO 14: avval bu faqat comment edi, haqiqiy kod yo'q edi
 *  2. Exports generateMetadata() (noindex for authenticated pages)
 *  3. Renders <OwnerUsersClient> inside <Suspense> with shimmer skeleton fallback
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { siteConfig } from '@/config/site.config';
import { OwnerUsersClient } from './OwnerUsersClient';

// ─── Props ────────────────────────────────────────────────────────────────────

interface UsersPageProps {
  params: Promise<{ locale: string }>;
}

// ─── Server-side role extraction (mirrors middleware logic) ───────────────────

// FIX XATO 14 + 15: server-side role guard implementation
// Avval: faqat comment edi ("1. Role-guard: redirects non-owners to /login (server-side)")
// Endi: haqiqiy cookies() + JWT parse + redirect kod ishlaydi
//
// FIX XATO 15 bog'liq: super_admin ham owner panelga kirishi kerak
// Bu funksiya super_admin rolini ham 'owner' kabi ko'rib chiqadi
function extractRoleFromJwt(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (!payload) return null;
    // Buffer ishlatmaymiz chunki bu Edge Runtime bilan mos kelmasligi mumkin
    // atob + TextDecoder — browser va Node.js Edge Runtime ikkalasida ishlaydi
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = atob(padded);
    const parsed = JSON.parse(decoded) as Record<string, unknown>;
    const role = parsed['role'];
    if (typeof role === 'string') return role;
    return null;
  } catch {
    return null;
  }
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
  return siteConfig.locales.map((locale) => ({ locale }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function OwnerUsersPage({ params }: UsersPageProps) {
  const { locale } = await params;

  // Unlock next-intl server calls for this locale segment
  setRequestLocale(locale);

  // ── FIX XATO 14: Server-side role guard ────────────────────────────────────
  // Avvalgi versiya: comment da "Role-guard" yozilgan edi, lekin haqiqiy kod yo'q edi.
  // Shuning uchun admin yoki teacher tokeni bilan /owner/users ga kirish mumkin edi.
  //
  // Yangi versiya:
  //   1. Cookie dan JWT token olinadi
  //   2. Token dan role decode qilinadi
  //   3. Role 'owner' yoki 'super_admin' bo'lmasa — o'z dashboard ga redirect
  //   4. Token yo'q bo'lsa — /login ga redirect
  //
  // FIX XATO 15 bilan bog'liq: super_admin ham /owner/* ga kirishi kerak.
  // Bu yerda super_admin ham ruxsat beriladi (middleware.ts da ham tuzatish kerak — alohida fayl).
  const cookieStore = await cookies();
  const COOKIE_NAME = process.env['NEXT_PUBLIC_AUTH_COOKIE_NAME'] ?? 'auth_token';
  const token = cookieStore.get(COOKIE_NAME)?.value;

  // Token yo'q → login sahifasiga
  if (!token) {
    redirect(`/${locale}/login`);
  }

  const role = extractRoleFromJwt(token);

  // Token noto'g'ri (parse qilib bo'lmadi) → login sahifasiga
  if (!role) {
    redirect(`/${locale}/login`);
  }

  // FIX XATO 15: super_admin ham owner panelga kira oladi
  // Avval: faqat 'owner' ruxsat berilgan (agar guard kod bo'lganida)
  // Endi: 'owner' VA 'super_admin' — ikkalasiga ham ruxsat
  const isAllowed = role === 'owner' || role === 'super_admin';

  if (!isAllowed) {
    // Noto'g'ri role → o'z dashboard ga yo'naltirish
    const roleRouteMap: Record<string, string> = {
      student: `/${locale}/student/dashboard`,
      teacher: `/${locale}/teacher/dashboard`,
      admin:   `/${locale}/admin/dashboard`,
    };
    const targetRoute = roleRouteMap[role] ?? `/${locale}/login`;
    redirect(targetRoute);
  }

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
      {/* Page title + invite button */}
      <div className="flex items-center justify-between gap-3">
        <div
          className="h-8 w-36 shimmer rounded-lg"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
        <div
          className="h-10 w-28 shimmer rounded-lg"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
      </div>

      {/* Toolbar row */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 flex-1 max-w-xs shimmer rounded-lg"
          style={{ background: 'var(--bg-surface-hover)' }}
        />
        <div
          className="h-10 w-28 shimmer rounded-lg"
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
          {[120, 200, 100, 90, 100, 80].map((w, i) => (
            <div
              key={i}
              className="shimmer rounded"
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
              className="h-9 w-9 shimmer rounded-full shrink-0"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
            {/* Name + email */}
            <div className="flex flex-col gap-1.5 flex-1">
              <div
                className="h-3 w-32 shimmer rounded"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
              <div
                className="h-2.5 w-48 shimmer rounded"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
            </div>
            {/* Role badge */}
            <div
              className="h-6 w-16 shimmer rounded-full"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
            {/* Status badge */}
            <div
              className="h-6 w-14 shimmer rounded-full"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
            {/* Last login */}
            <div
              className="h-3 w-20 shimmer rounded"
              style={{ background: 'var(--bg-surface-hover)' }}
            />
            {/* Actions */}
            <div
              className="h-8 w-20 shimmer rounded-lg"
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
                className="h-10 w-10 shimmer rounded-full shrink-0"
                style={{ background: 'var(--bg-surface-hover)' }}
              />
              <div className="flex-1 space-y-2">
                <div
                  className="h-3.5 w-28 shimmer rounded"
                  style={{ background: 'var(--bg-surface-hover)' }}
                />
                <div
                  className="h-2.5 w-40 shimmer rounded"
                  style={{ background: 'var(--bg-surface-hover)' }}
                />
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <div
                  className="h-6 w-16 shimmer rounded-full"
                  style={{ background: 'var(--bg-surface-hover)' }}
                />
                <div
                  className="h-5 w-12 shimmer rounded-full"
                  style={{ background: 'var(--bg-surface-hover)' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
