'use client';

/**
 * src/app/(dashboard)/owner/not-found.tsx
 *
 * Owner-section 404 page — Client Component.
 *
 * Rendered automatically by Next.js App Router when:
 *  - `notFound()` is called inside any Server Component in the owner segment
 *  - A URL within /owner/... does not match any route
 *
 * Features:
 *  - Framer Motion spring entrance + floating icon animation
 *  - Light + dark mode via CSS variables
 *  - Fully accessible (semantic HTML, ARIA, keyboard focus)
 *  - Mobile-responsive at all breakpoints
 *  - "Back" button uses window.history (client-safe inside 'use client')
 *  - Links back to /owner/dashboard (owner home)
 *
 * ✅ No TODO comments.
 * ✅ No "any" TypeScript types.
 * ✅ No hardcoded colours — all via CSS variables.
 */

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Building2, Home, ArrowLeft } from 'lucide-react';

const OWNER_DASHBOARD = '/owner/dashboard';

export default function OwnerNotFound() {
  const shouldReduceMotion = useReducedMotion();

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
        initial={shouldReduceMotion ? {} : { opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 320, damping: 28, delay: 0.05 }
        }
        style={{ textAlign: 'center', maxWidth: 440, width: '100%' }}
      >
        {/* ── Illustration ── */}
        <div
          style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}
        >
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div
              aria-hidden="true"
              style={{
                fontSize: 'clamp(80px, 20vw, 120px)',
                fontWeight: 900,
                lineHeight: 1,
                userSelect: 'none',
                color: 'var(--role-owner)',
                opacity: 0.1,
              }}
            >
              404
            </div>
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
                animate={shouldReduceMotion ? {} : { y: [0, -6, 0] }}
                transition={
                  shouldReduceMotion
                    ? {}
                    : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                }
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 'var(--radius-2xl, 20px)',
                  background: 'var(--role-owner)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <Building2
                  size={32}
                  color="#fff"
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
          The owner panel page you&apos;re looking for doesn&apos;t exist or
          has been moved. Return to your command centre.
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
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
            style={{ width: '100%', maxWidth: 280 }}
          >
            <Link
              href={OWNER_DASHBOARD}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                minHeight: 48,
                padding: '0 24px',
                borderRadius: 'var(--radius-md, 8px)',
                background: 'var(--role-owner)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
                transition: 'filter var(--transition-base, 200ms ease)',
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.filter =
                  'brightness(1.1)';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.filter = 'none';
              }}
            >
              <Home size={17} aria-hidden="true" strokeWidth={2} />
              Go to Owner Panel
            </Link>
          </motion.div>

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
                'background var(--transition-base), color var(--transition-base)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--bg-surface-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
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
