'use client';

import { useEffect, useReducer } from 'react';
import { useMotionValue, animate } from 'framer-motion';

// ─── CountUp ──────────────────────────────────────────────────────────────────
//
// Animated number counter — counts from `from` to `to` over `duration` seconds
// using Framer Motion's `animate()` utility for smooth easing.
//
// Per the prompt spec (animation #10):
//   "KPI cards: count-up number animation on mount"
//
// Accessibility:
//   aria-label always reflects the final value so screen readers announce
//   the correct number immediately rather than mid-animation noise.
//
// Reduced motion:
//   When `prefers-reduced-motion: reduce` is detected the value snaps to `to`
//   instantly with no animation, satisfying the prompt requirement:
//   "All animations MUST respect @media (prefers-reduced-motion: reduce)"
//
// Props:
//   from      – starting number (default 0)
//   to        – target number (required)
//   duration  – animation length in seconds (default 1.2)
//   decimals  – decimal places shown (default 0)
//   prefix    – text prepended to number, e.g. "$" (default "")
//   suffix    – text appended to number,  e.g. "%" (default "")
//   className – forwarded to the wrapping <span>
//
// Usage:
//   <CountUp to={1842} prefix="$" />
//   <CountUp from={80} to={96} suffix="%" decimals={1} duration={0.8} />

interface CountUpProps {
  from?: number;
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

type DisplayAction = number;

function formatValue(value: number, decimals: number, prefix: string, suffix: string): string {
  return `${prefix}${value.toFixed(decimals)}${suffix}`;
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
    (_prev: string, next: DisplayAction) => formatValue(next, decimals, prefix, suffix),
    formatValue(from, decimals, prefix, suffix),
  );

  useEffect(() => {
    // Detect reduced-motion preference on the client
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Snap immediately — no animation
      setDisplayValue(to);
      return;
    }

    // Animate from current value to `to`
    const controls = animate(motionValue, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplayValue(latest),
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to, duration]);

  return (
    <span
      className={className}
      aria-label={formatValue(to, decimals, prefix, suffix)}
    >
      {displayValue}
    </span>
  );
}
