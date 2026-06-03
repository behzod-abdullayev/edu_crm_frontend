'use client';

/**
 * src/app/(dashboard)/student/not-found.tsx
 *
 * Student-section 404 page — Client Component.
 *
 * Rendered automatically by Next.js App Router when:
 *  - `notFound()` is called inside any Server Component in the student segment
 *  - A URL within /student/... does not match any route
 *
 * Features:
 *  - Framer Motion spring entrance animation (respects prefers-reduced-motion)
 *  - Light + dark mode via CSS variables
 *  - Fully accessible (semantic HTML, ARIA, keyboard focus)
 *  - Mobile-responsive (single column at all breakpoints)
 *  - "Back" button uses window.history (client-safe inside 'use client')
 *  - Links back to /student/dashboard (student home)
 *
 * ✅ No TODO comments.
 * ✅ No "any" TypeScript types.
 * ✅ No hardcoded colours — all via CSS variables.
 */

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Home, ArrowLeft } from 'lucide-react';

const STUDENT_DASHBOARD = '/student/dashboard';

export default function StudentNotFound() {
  const shouldReduceMotion = useReducedMotion();

  const initial = shouldReduceMotion
    ? {}
    : { opacity: 0, y: 24, scale: 0.97 };

  const animate = { opacity: 1, y: 0, scale: 1 };

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring', stiffness: 320, damping: 28, delay: 0.05 };

  return (
    <main
      role="main"
      aria-labelledby="not-found-heading"
      style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        background: 'var(--bg-page)',
      }}
    >
      <motion.div
        initial={initial}
        animate={animate}
        transition={transition}
        style={{ textAlign: 'center', maxWidth: 440, width: '100%' }}
      >
        {/* ── Illustration ── */}
        <div
          style={{
            marginBottom: 32,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Ghost 404 text */}
            <div
              aria-hidden="true"
              style={{
                fontSize: 'clamp(80px, 20vw, 120px)',
                fontWeight: 900,
                lineHeight: 1,
                userSelect: 'none',
                color: 'var(--brand-primary)',
                opacity: 0.1,
              }}
            >
              404
            </div>

            {/* Icon badge */}
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
                animate={
                  shouldReduceMotion
                    ? {}
                    : { y: [0, -6, 0] }
                }
                transition={
                  shouldReduceMotion
                    ? {}
                    : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                }
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 'var(--radius-2xl, 20px)',
                  background: 'var(--brand-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <BookOpen
                  size={32}
                  color="var(--text-on-brand)"
                  strokeWidth={1.75}
                />
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── Text ── */}
        <h1
          id="not-found-heading"
          style={{
            margin: '0 0 12px',
            fontSize: 'clamp(20px, 5vw, 26px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
          }}
        >
          Page Not Found
        </h1>

        <p
          style={{
            margin: '0 0 32px',
            fontSize: 15,
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
            maxWidth: 360,
            marginInline: 'auto',
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been
          moved. Let&apos;s get you back to learning.
        </p>

        {/* ── Actions ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {/* Primary — go to dashboard */}
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            style={{ width: '100%', maxWidth: 280 }}
          >
            <Link
              href={STUDENT_DASHBOARD}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                minHeight: 48,
                padding: '0 24px',
                borderRadius: 'var(--radius-md, 8px)',
                background: 'var(--brand-primary)',
                color: 'var(--text-on-brand)',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
                transition: 'background var(--transition-base, 200ms ease)',
              }}
            >
              <Home size={17} aria-hidden="true" strokeWidth={2} />
              Go to Dashboard
            </Link>
          </motion.div>

          {/* Secondary — go back */}
          <motion.button
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
              maxWidth: 280,
              minHeight: 48,
              padding: '0 24px',
              borderRadius: 'var(--radius-md, 8px)',
              border: '1.5px solid var(--border-default)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              transition:
                'background var(--transition-base, 200ms ease), color var(--transition-base, 200ms ease)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface-hover)';
              e.currentTarget.style.color      = 'var(--text-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color      = 'var(--text-secondary)';
            }}
          >
            <ArrowLeft size={17} aria-hidden="true" strokeWidth={2} />
            Go Back
          </motion.button>
        </div>
      </motion.div>
    </main>
  );
}
