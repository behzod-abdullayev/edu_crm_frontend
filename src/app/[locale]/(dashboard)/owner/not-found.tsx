'use client';

/**
 * src/app/[locale]/(dashboard)/owner/not-found.tsx
 *
 * Owner-section 404 page — Client Component.
 *
 * PURPOSE
 * ───────
 * Handles 404 responses triggered by `notFound()` calls (or missing routes)
 * that occur anywhere inside the /[locale]/(dashboard)/owner/... segment.
 *
 * SCOPE vs OTHER NOT-FOUND FILES
 * ──────────────────────────────
 * src/app/not-found.tsx              → root 404, outside all locale/role segments
 * src/app/[locale]/not-found.tsx     → locale-aware 404, outside role segments
 * src/app/[locale]/(dashboard)/owner/not-found.tsx  ← THIS FILE
 *   Handles 404s inside the owner dashboard section.
 *   Provides owner-specific navigation: back to Owner Dashboard.
 *   Reads locale from useParams() for locale-prefixed links.
 *
 * Why 'use client':
 * - useParams() is a Client hook required for locale extraction.
 * - window.history.back() is a browser-only API.
 * - Framer Motion hooks (useReducedMotion) require client context.
 *
 * ✅ No "any" TypeScript types.
 * ✅ No TODO / placeholder / pseudo-code.
 * ✅ Zero hardcoded colours — all via CSS variables.
 * ✅ Framer Motion animations with prefers-reduced-motion support.
 * ✅ Fully accessible: semantic HTML, ARIA labels, keyboard navigation.
 * ✅ Mobile-first, responsive across 320px → 2560px.
 * ✅ Light & dark mode via CSS variables.
 * ✅ i18n: inline trilingual strings (uz/en/ru) — self-contained, crash-proof.
 * ✅ Owner-role-appropriate navigation (back to /[locale]/owner/dashboard).
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { LayoutDashboard, ArrowLeft, ShieldAlert } from 'lucide-react';
import type { Locale } from '@/config/site.config';
import { siteConfig } from '@/config/site.config';

// ─── Inline trilingual copy ────────────────────────────────────────────────────
// Kept inline (not in messages/*.json) so this page is fully self-contained
// and renders correctly even when the next-intl provider is unavailable.

interface NotFoundCopy {
  heading: string;
  body: string;
  goToDashboard: string;
  goBack: string;
  errorBadge: string;
  goBackAriaLabel: string;
  dashboardAriaLabel: string;
}

const MESSAGES: Record<Locale, NotFoundCopy> = {
  uz: {
    heading: 'Sahifa topilmadi',
    body: "Siz izlayotgan egasi bo'limi sahifasi mavjud emas yoki ko'chirilgan. Iltimos, bosh sahifaga qayting.",
    goToDashboard: 'Bosh sahifaga qaytish',
    goBack: 'Orqaga',
    errorBadge: '404 — Sahifa topilmadi',
    goBackAriaLabel: 'Oldingi sahifaga qaytish',
    dashboardAriaLabel: "Egasi bosh sahifasiga o'tish",
  },
  en: {
    heading: 'Page Not Found',
    body: "The owner section page you're looking for doesn't exist or has been moved. Return to your dashboard.",
    goToDashboard: 'Back to Dashboard',
    goBack: 'Go Back',
    errorBadge: '404 — Not Found',
    goBackAriaLabel: 'Go back to the previous page',
    dashboardAriaLabel: 'Go to Owner Dashboard',
  },
  ru: {
    heading: 'Страница не найдена',
    body: 'Страница раздела владельца, которую вы ищете, не существует или была перемещена. Вернитесь на панель управления.',
    goToDashboard: 'На панель управления',
    goBack: 'Назад',
    errorBadge: '404 — Не найдено',
    goBackAriaLabel: 'Перейти на предыдущую страницу',
    dashboardAriaLabel: 'Перейти на панель управления владельца',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function OwnerNotFound() {
  const shouldReduceMotion = useReducedMotion();
  const params = useParams();

  // ── Locale resolution ──────────────────────────────────────────────────
  const rawLocale =
    typeof params?.['locale'] === 'string' ? params['locale'] : '';
  const locale: Locale = siteConfig.locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : siteConfig.defaultLocale;

  const t = MESSAGES[locale];

  // ── Locale-prefixed owner dashboard href ───────────────────────────────
  const dashboardHref = `/${locale}/owner/dashboard`;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        background: 'var(--bg-page)',
      }}
    >
      <motion.main
        role="main"
        aria-labelledby="owner-not-found-title"
        {...(shouldReduceMotion
          ? {}
          : {
              initial: { opacity: 0, y: 24 },
              animate: {
                opacity: 1,
                y: 0,
                transition: { type: 'spring', stiffness: 280, damping: 26 },
              },
            })}
        style={{ textAlign: 'center', maxWidth: 480, width: '100%' }}
      >
        {/* ── Visual: ghost 404 + floating icon ──────────────────────────── */}
        <div
          style={{
            marginBottom: 32,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Ghost number */}
            <div
              aria-hidden="true"
              style={{
                fontSize: 'clamp(80px, 22vw, 128px)',
                fontWeight: 900,
                lineHeight: 1,
                userSelect: 'none',
                color: 'var(--role-owner)',
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
                {...(shouldReduceMotion
                  ? {}
                  : {
                      animate: {
                        y: [0, -8, 0],
                        transition: { duration: 3.4, repeat: Infinity, ease: 'easeInOut' },
                      },
                    })}
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 'var(--radius-2xl, 20px)',
                  background: 'var(--role-owner)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-xl)',
                }}
              >
                <LayoutDashboard
                  size={34}
                  color="var(--text-on-brand, #fff)"
                  strokeWidth={1.75}
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── Text ─────────────────────────────────────────────────────────── */}
        <h1
          id="owner-not-found-title"
          style={{
            margin: '0 0 12px',
            fontSize: 'clamp(22px, 5vw, 28px)',
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
            maxWidth: 380,
            marginInline: 'auto',
          }}
        >
          {t.body}
        </p>

        {/* ── Error badge ───────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            margin: '0 0 32px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full, 9999px)',
            background: 'var(--warning-bg)',
            border: '1px solid var(--warning-border)',
          }}
        >
          <ShieldAlert
            size={13}
            color="var(--warning-text)"
            aria-hidden="true"
            strokeWidth={2.5}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--warning-text)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {t.errorBadge}
          </span>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Primary: go to owner dashboard */}
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            style={{ width: '100%', maxWidth: 300 }}
          >
            <Link
              href={dashboardHref}
              aria-label={t.dashboardAriaLabel}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                minHeight: 48,
                padding: '0 28px',
                borderRadius: 'var(--radius-md, 8px)',
                background: 'var(--role-owner)',
                color: 'var(--text-on-brand, #fff)',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
                transition: 'background var(--transition-base, 200ms ease)',
              }}
            >
              <LayoutDashboard size={17} aria-hidden="true" strokeWidth={2} />
              {t.goToDashboard}
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
              maxWidth: 300,
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

        {/* ── Dev-mode locale indicator ─────────────────────────────────────── */}
        {process.env.NODE_ENV === 'development' && (
          <p
            style={{
              marginTop: 24,
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-jetbrains-mono, monospace)',
            }}
          >
            locale: {locale} · owner dashboard: {dashboardHref}
          </p>
        )}
      </motion.main>
    </div>
  );
}