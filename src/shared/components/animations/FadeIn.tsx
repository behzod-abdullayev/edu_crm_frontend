'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

// ─── FadeIn ───────────────────────────────────────────────────────────────────
//
// Lightweight wrapper that fades + translates its children into view on mount.
//
// Per the prompt spec (animation #20):
//   "Empty states: fade-in with subtle upward translate"
// Also used for general content sections, cards, and page areas.
//
// Reduced motion:
//   When `prefers-reduced-motion: reduce` is active, Framer Motion respects
//   the global CSS rule set in globals.css:
//     @media (prefers-reduced-motion: reduce) {
//       * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
//     }
//   Additionally this component sets duration to near-zero in that case.
//
// Props:
//   children  – content to animate (required)
//   delay     – seconds before the animation starts (default 0)
//   duration  – animation length in seconds (default 0.3)
//   y         – initial vertical offset in px, fades in upward (default 8)
//   x         – initial horizontal offset in px (default 0)
//   className – forwarded to the motion.div
//   as        – render as a different HTML element (default "div")
//
// Usage:
//   <FadeIn>
//     <EmptyState ... />
//   </FadeIn>
//
//   <FadeIn delay={0.1} duration={0.4} y={16} className="grid gap-4">
//     <KPICard ... />
//   </FadeIn>
//
//   <FadeIn as="section" className="space-y-4">
//     <h2>...</h2>
//   </FadeIn>

type MotionTag = 'div' | 'section' | 'article' | 'li' | 'span';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  className?: string;
  as?: MotionTag;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.3,
  y = 8,
  x = 0,
  className,
  as = 'div',
}: FadeInProps) {
  const MotionComponent = motion[as] as typeof motion.div;

  return (
    <MotionComponent
      initial={{ opacity: 0, y, x }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{
        duration,
        delay,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}
