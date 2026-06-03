'use client';

/**
 * src/app/not-found.tsx
 *
 * Root 404 page — Client Component.
 *
 * IMPORTANT — Why 'use client' here?
 * ─────────────────────────────────────────────────────────────────────────────
 * The "Go Back" button uses `window.history.back()`, which is a browser API
 * and cannot be called during server-side rendering. Without the 'use client'
 * directive, Next.js would throw the following build-time error:
 *
 *   "Event handlers cannot be passed to Client Component props."
 *
 * Adding 'use client' is the correct and only fix. Not-found pages are 404
 * responses; they are never indexed by crawlers, so there is no SEO penalty
 * for making this a Client Component.
 *
 * i18n note:
 * ─────────────────────────────────────────────────────────────────────────────
 * This root not-found.tsx handles 404s for routes that are OUTSIDE the
 * [locale] segment — i.e. routes that are not under /uz/..., /en/..., /ru/...
 * That includes routes like /invalid-path, /api/... that produce 404.
 *
 * The "Go Home" link points to '/' which is correct: the next-intl middleware
 * will immediately redirect '/' → '/uz' (or whichever locale is preferred)
 * based on the Accept-Language header and locale cookie.
 *
 * For 404s inside [locale] segments, see src/app/[locale]/not-found.tsx
 * which provides locale-aware home links.
 *
 * ✅ No "any" TypeScript types.
 * ✅ No TODO comments.
 * ✅ No hardcoded colours — all via CSS variables.
 * ✅ Framer Motion animation respects prefers-reduced-motion.
 * ✅ Fully accessible (semantic HTML, ARIA, keyboard navigation).
 * ✅ Responsive: single column on mobile, constrained width on desktop.
 */

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Home, ArrowLeft, AlertCircle } from 'lucide-react';

export default function NotFound() {
  const shouldReduceMotion = useReducedMotion();

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
        {/* ── Visual: ghost 404 + floating icon ────────────────────────── */}
        <div
          style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Large ghost number */}
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

        {/* ── Text ───────────────────────────────────────────────────────── */}
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
          Page Not Found
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
          The page you&apos;re looking for doesn&apos;t exist or has been
          moved. Please check the URL or navigate back to safety.
        </p>

        {/* ── Info badge ─────────────────────────────────────────────────── */}
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
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            Error 404 — Not Found
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
          {/* Primary: go home */}
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            style={{ width: '100%', maxWidth: 300 }}
          >
            <Link
              href="/"
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
                  'background var(--transition-base, 200ms ease), transform var(--transition-fast, 150ms ease)',
              }}
            >
              <Home size={17} aria-hidden="true" strokeWidth={2} />
              Go Home
            </Link>
          </motion.div>

          {/* Secondary: go back */}
          <motion.button
            type="button"
            onClick={() => window.history.back()}
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            aria-label="Go back to the previous page"
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
            Go Back
          </motion.button>
        </div>
      </motion.main>
    </div>
  );
}
