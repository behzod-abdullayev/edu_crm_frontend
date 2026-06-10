'use client';

import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { useEffect, useReducer } from 'react';

// ─── PageTransition ──────────────────────────────────────────────────────────

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── FadeIn ──────────────────────────────────────────────────────────────────

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  y?: number;
}

export function FadeIn({ children, delay = 0, duration = 0.3, className, y = 8 }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── StaggerList ─────────────────────────────────────────────────────────────

interface StaggerListProps {
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export function StaggerList({ children, staggerDelay = 0.05, className }: StaggerListProps) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.25,
            delay: Math.min(i, 9) * staggerDelay,
            ease: 'easeOut',
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

// ─── CountUp ─────────────────────────────────────────────────────────────────

interface CountUpProps {
  from?: number;
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

export function CountUp({
  from = 0,
  to,
  duration = 1.2,
  prefix = '',
  suffix = '',
  decimals = 0,
  className,
}: CountUpProps) {
  const motionValue = useMotionValue(from);
  const [displayValue, setDisplayValue] = useReducer(
    (_: string, next: number) => `${prefix}${next.toFixed(decimals)}${suffix}`,
    `${prefix}${from.toFixed(decimals)}${suffix}`
  );

  const prefersReducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayValue(to);
      return;
    }
    const controls = animate(motionValue, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayValue(latest),
    });
    return controls.stop;
  }, [to, duration, motionValue, prefersReducedMotion]);

  return (
    <span className={className} aria-label={`${prefix}${to.toFixed(decimals)}${suffix}`}>
      {displayValue}
    </span>
  );
}
