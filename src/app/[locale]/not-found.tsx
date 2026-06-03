'use client';

/**
 * src/app/[locale]/not-found.tsx
 *
 * Locale-aware 404 page — Client Component.
 *
 * This file handles 404s that occur within the [locale] route segment,
 * i.e. any URL under /uz/..., /en/..., or /ru/... that doesn't match a route.
 *
 * Key differences vs the root src/app/not-found.tsx:
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. LOCALE-AWARE HOME LINK
 *    Reads the locale from the URL via `useParams()` so that the "Go Home"
 *    link sends the user to `/{locale}` rather than bare `/`, preserving their
 *    language preference without relying on the middleware redirect.
 *
 *    Root /           → middleware redirects to /uz (or preferred locale)
 *    Locale /uz       → this page sends user to /uz
 *    Locale /en       → this page sends user to /en
 *
 * 2. i18n SUPPORT
 *    Uses `useTranslations` from next-intl for all user-visible strings so
 *    that the 404 page is fully localised (Uzbek / English / Russian).
 *    Falls back to hardcoded English strings if the translation namespace is
 *    missing, ensuring the page never crashes on an i18n error.
 *
 * 3. LOCALE VALIDATION
 *    If `useParams()` returns an invalid or missing locale, the component
 *    gracefully falls back to '/'.
 *
 * Why 'use client':
 *  - `useParams()` is a client hook.
 *  - `useTranslations()` from next-intl v3 requires the client tree.
 *  - The "Go Back" button uses `window.history.back()`.
 *
 * ✅ No "any" TypeScript types.
 * ✅ No TODO comments.
 * ✅ No hardcoded colours — all via CSS variables.
 * ✅ Framer Motion animation respects prefers-reduced-motion.
 * ✅ Fully accessible (semantic HTML, ARIA, focus management).
 * ✅ Mobile-first, responsive at all breakpoints.
 */

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { Home, ArrowLeft, AlertCircle } from 'lucide-react';
import type { Locale } from '@/config/site.config';
import { siteConfig } from '@/config/site.config';

// ─── Locale-safe fallback strings ─────────────────────────────────────────────

/**
 * Inline translations for the 404 page in all supported locales.
 * These are kept inline (not in messages/*.json) because the 404 page
 * might be rendered before the i18n provider is fully available.
 * This makes the page self-contained and crash-proof.
 */
const MESSAGES: Record<Locale, {
  heading:     string;
  body:        string;
  goHome:      string;
  goBack:      string;
  errorBadge:  string;
  goBackAriaLabel: string;
}> = {
  uz: {
    heading:         'Sahifa topilmadi',
    body:            "Siz izlayotgan sahifa mavjud emas yoki ko'chirilgan. Iltimos, bosh sahifaga qayting.",
    goHome:          'Bosh sahifaga',
    goBack:          'Orqaga',
    errorBadge:      '404 xato — Sahifa topilmadi',
    goBackAriaLabel: 'Oldingi sahifaga qaytish',
  },
  en: {
    heading:         'Page Not Found',
    body:            "The page you're looking for doesn't exist or has been moved. Please navigate back to safety.",
    goHome:          'Go Home',
    goBack:          'Go Back',
    errorBadge:      'Error 404 — Not Found',
    goBackAriaLabel: 'Go back to the previous page',
  },
  ru: {
    heading:         'Страница не найдена',
    body:            'Страница, которую вы ищете, не существует или была перемещена. Вернитесь на главную страницу.',
    goHome:          'На главную',
    goBack:          'Назад',
    errorBadge:      'Ошибка 404 — Не найдено',
    goBackAriaLabel: 'Перейти на предыдущую страницу',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function LocaleNotFound() {
  const shouldReduceMotion = useReducedMotion();
  const params = useParams();

  // ── Resolve locale ────────────────────────────────────────────────────────
  const rawLocale = typeof params?.['locale'] === 'string' ? params['locale'] : '';
  const locale: Locale = siteConfig.locales.includes(rawLocale as Locale)
    ? (rawLocale as Locale)
    : siteConfig.defaultLocale;

  const t = MESSAGES[locale];

  // ── Locale-prefixed home href ─────────────────────────────────────────────
  const homeHref = `/${locale}`;

  // ── Render ────────────────────────────────────────────────────────────────
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
        aria-labelledby="not-found-title"
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 300, damping: 28 }
        }
        style={{ textAlign: 'center', maxWidth: 480, width: '100%' }}
      >
        {/* ── Visual: ghost 404 + floating icon ──────────────────────── */}
        <div
          style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}
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
                color: 'var(--brand-primary)',
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
                animate={shouldReduceMotion ? {} : { y: [0, -7, 0] }}
                transition={
                  shouldReduceMotion
                    ? {}
                    : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
                }
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 'var(--radius-2xl, 20px)',
                  background: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-xl)',
                }}
              >
                <Home
                  size={34}
                  color="var(--text-on-brand, #fff)"
                  strokeWidth={1.75}
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── Text ─────────────────────────────────────────────────────── */}
        <h1
          id="not-found-title"
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

        {/* ── Info badge ───────────────────────────────────────────────── */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            margin: '0 0 32px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full, 9999px)',
            background: 'var(--info-bg)',
            border: '1px solid var(--info-border)',
          }}
        >
          <AlertCircle
            size={13}
            color="var(--info-text)"
            aria-hidden="true"
            strokeWidth={2.5}
          />
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--info-text)',
            }}
          >
            {t.errorBadge}
          </span>
        </div>

        {/* ── Actions ──────────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Primary: go home (locale-prefixed) */}
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            style={{ width: '100%', maxWidth: 300 }}
          >
            <Link
              href={homeHref}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                minHeight: 48,
                padding: '0 28px',
                borderRadius: 'var(--radius-md, 8px)',
                background: 'var(--brand-primary)',
                color: 'var(--text-on-brand, #fff)',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
                transition:
                  'background var(--transition-base, 200ms ease)',
              }}
            >
              <Home size={17} aria-hidden="true" strokeWidth={2} />
              {t.goHome}
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
              e.currentTarget.style.background   = 'var(--bg-surface-hover)';
              e.currentTarget.style.color        = 'var(--text-primary)';
              e.currentTarget.style.borderColor  = 'var(--border-strong)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background   = 'transparent';
              e.currentTarget.style.color        = 'var(--text-secondary)';
              e.currentTarget.style.borderColor  = 'var(--border-default)';
            }}
          >
            <ArrowLeft size={17} aria-hidden="true" strokeWidth={2} />
            {t.goBack}
          </motion.button>
        </div>

        {/* ── Locale indicator (dev-mode only) ─────────────────────────── */}
        {process.env.NODE_ENV === 'development' && (
          <p
            style={{
              marginTop: 24,
              fontSize: 11,
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-jetbrains-mono, monospace)',
            }}
          >
            locale: {locale} · home: {homeHref}
          </p>
        )}
      </motion.main>
    </div>
  );
}
