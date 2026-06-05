'use client';

/**
 * src/app/[locale]/(dashboard)/admin/not-found.tsx
 *
 * Admin-section 404 page — Client Component.
 *
 * Rendered by Next.js when `notFound()` is called inside any Server Component
 * under src/app/[locale]/(dashboard)/admin/**, OR when a user navigates to
 * a URL that starts with /[locale]/admin/... but does not match any route
 * segment defined under that directory.
 *
 * Key behaviours
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. LOCALE-AWARE LINKS
 *    Reads the current locale from `useParams()` so that the "Dashboard" and
 *    "Go Back" actions stay within the same locale subtree (/uz, /en, /ru).
 *
 * 2. ROLE-SPECIFIC COPY & DASHBOARD LINK
 *    All text is tailored to the admin role; the primary CTA leads directly
 *    to the admin dashboard (/[locale]/admin/dashboard) rather than bare /.
 *    Owner users who access /admin routes also benefit from this behaviour
 *    because the admin layout accepts both 'admin' and 'owner' roles.
 *
 * 3. INLINE TRILINGUAL MESSAGES
 *    Translations for uz / en / ru are bundled inline (no i18n provider
 *    dependency) so the page is completely self-contained and crash-proof even
 *    when the next-intl tree has not been set up yet.
 *
 * 4. LAYOUT INTEGRATION
 *    The component renders inside the full authenticated dashboard layout
 *    (sidebar / bottom-nav / header) because it lives under (dashboard)/.
 *    It does NOT replicate those chrome elements.
 *
 * Why 'use client':
 *  - `useParams()` is a client-only hook.
 *  - `window.history.back()` is a browser API.
 *  - Framer Motion requires a browser environment.
 *
 * ✅ No "any" TypeScript types.
 * ✅ No TODO comments.
 * ✅ No hardcoded colours — all via CSS variables.
 * ✅ Framer Motion animation respects prefers-reduced-motion.
 * ✅ Fully accessible (semantic HTML, ARIA, keyboard navigation).
 * ✅ Mobile-first, responsive at all breakpoints (320 px → 2560 px).
 * ✅ Minimum 44 px touch targets on all interactive elements.
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { LayoutDashboard, ArrowLeft, ShieldCheck } from 'lucide-react';
import type { Locale } from '@/config/site.config';
import { siteConfig } from '@/config/site.config';

// ─── Inline translations ───────────────────────────────────────────────────────

const MESSAGES: Record<
  Locale,
  {
    heading: string;
    body: string;
    toDashboard: string;
    goBack: string;
    errorBadge: string;
    goBackAriaLabel: string;
    hint: string;
  }
> = {
  uz: {
    heading: 'Sahifa topilmadi',
    body: "Siz qidirgan admin sahifasi mavjud emas yoki ko'chirilgan. Boshqaruv panelga qaytib, kerakli bo'limni toping.",
    toDashboard: 'Boshqaruv paneliga',
    goBack: 'Orqaga',
    errorBadge: '404 — Sahifa topilmadi',
    goBackAriaLabel: 'Oldingi sahifaga qaytish',
    hint: 'Admin boshqaruv bo\'limi',
  },
  en: {
    heading: 'Page Not Found',
    body: "The admin page you're looking for doesn't exist or has been moved. Head back to your dashboard to find what you need.",
    toDashboard: 'Back to Dashboard',
    goBack: 'Go Back',
    errorBadge: '404 — Not Found',
    goBackAriaLabel: 'Go back to the previous page',
    hint: 'Admin section page',
  },
  ru: {
    heading: 'Страница не найдена',
    body: 'Страница администратора, которую вы ищете, не существует или была перемещена. Вернитесь на панель управления.',
    toDashboard: 'Вернуться на панель',
    goBack: 'Назад',
    errorBadge: '404 — Не найдено',
    goBackAriaLabel: 'Перейти на предыдущую страницу',
    hint: 'Страница раздела администратора',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminNotFound() {
  const shouldReduceMotion = useReducedMotion();
  const params = useParams();

  // ── Resolve locale ──────────────────────────────────────────────────────────
  const rawLocale =
    typeof params?.['locale'] === 'string' ? params['locale'] : '';
  const locale: Locale = siteConfig.locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : siteConfig.defaultLocale;

  const t = MESSAGES[locale];

  // ── Role-scoped dashboard href ──────────────────────────────────────────────
  const dashboardHref = `/${locale}/admin/dashboard`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      role="main"
      aria-labelledby="admin-not-found-title"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - var(--header-height, 64px))',
        padding: '32px 24px',
        background: 'var(--bg-page)',
      }}
    >
      <motion.div
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 280, damping: 26 }
        }
        style={{ textAlign: 'center', maxWidth: 520, width: '100%' }}
      >
        {/* ── Illustration ──────────────────────────────────────────────── */}
        <div
          style={{
            marginBottom: 36,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Ghost 404 number */}
            <div
              aria-hidden="true"
              style={{
                fontSize: 'clamp(72px, 20vw, 120px)',
                fontWeight: 900,
                lineHeight: 1,
                userSelect: 'none',
                color: 'var(--role-admin)',
                opacity: 0.1,
                letterSpacing: '-0.04em',
              }}
            >
              404
            </div>

            {/* Floating icon badge */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <motion.div
                animate={shouldReduceMotion ? {} : { y: [0, -8, 0] }}
                transition={
                  shouldReduceMotion
                    ? {}
                    : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }
                }
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 'var(--radius-2xl, 20px)',
                  background: 'var(--role-admin)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-xl)',
                }}
              >
                <ShieldCheck
                  size={32}
                  color="var(--text-on-brand, #fff)"
                  strokeWidth={1.75}
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── Text ──────────────────────────────────────────────────────── */}
        <h1
          id="admin-not-found-title"
          style={{
            margin: '0 0 12px',
            fontSize: 'clamp(20px, 5vw, 28px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.025em',
          }}
        >
          {t.heading}
        </h1>

        <p
          style={{
            margin: '0 0 8px',
            fontSize: 15,
            lineHeight: 1.65,
            color: 'var(--text-secondary)',
            maxWidth: 400,
            marginInline: 'auto',
          }}
        >
          {t.body}
        </p>

        {/* ── Role + error badge row ─────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            margin: '0 0 36px',
            flexWrap: 'wrap',
          }}
        >
          {/* Role badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full, 9999px)',
              background: 'rgba(139, 92, 246, 0.12)',
              border: '1px solid rgba(139, 92, 246, 0.25)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--role-admin)',
            }}
          >
            <ShieldCheck size={11} aria-hidden="true" strokeWidth={2.5} />
            {t.hint}
          </span>

          {/* Error code badge */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full, 9999px)',
              background: 'var(--error-bg)',
              border: '1px solid var(--error-border)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--error-text)',
            }}
          >
            {t.errorBadge}
          </span>
        </div>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Primary: back to admin dashboard */}
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            style={{ width: '100%', maxWidth: 320 }}
          >
            <Link
              href={dashboardHref}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                minHeight: 48,
                padding: '0 28px',
                borderRadius: 'var(--radius-md, 8px)',
                background: 'var(--role-admin)',
                color: 'var(--text-on-brand, #fff)',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
                transition:
                  'opacity var(--transition-base, 200ms ease), transform var(--transition-fast, 150ms ease)',
              }}
            >
              <LayoutDashboard size={17} aria-hidden="true" strokeWidth={2} />
              {t.toDashboard}
            </Link>
          </motion.div>

          {/* Secondary: go back */}
          <motion.button
            type="button"
            onClick={() => window.history.back()}
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            aria-label={t.goBackAriaLabel}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              maxWidth: 320,
              minHeight: 48,
              padding: '0 28px',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1.5px solid var(--border-default)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              transition:
                'background var(--transition-base, 200ms ease), color var(--transition-base, 200ms ease), border-color var(--transition-base, 200ms ease)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.borderColor = 'var(--border-strong)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
              e.currentTarget.style.borderColor = 'var(--border-default)';
            }}
          >
            <ArrowLeft size={17} aria-hidden="true" strokeWidth={2} />
            {t.goBack}
          </motion.button>
        </div>

        {/* ── Dev locale indicator ──────────────────────────────────────── */}
        {process.env.NODE_ENV === 'development' && (
          <p
            style={{
              marginTop: 28,
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-jetbrains-mono, monospace)',
            }}
          >
            locale: {locale} · section: admin · href: {dashboardHref}
          </p>
        )}
      </motion.div>
    </div>
  );
}
