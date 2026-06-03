'use client';

import * as React from 'react';
import { cn } from '@shared/utils/cn';

// ─── Skeleton ─────────────────────────────────────────────────────────────────
//
// Shimmer placeholder used during loading states.
// Per the prompt spec, ALL loading states MUST use shimmer skeletons —
// spinners are forbidden for page-level content.
//
// Animation:  left-to-right shimmer pulse, 1.5 s loop
//             defined in tailwind.config.ts → keyframes.shimmer
//             and globals.css → @media (prefers-reduced-motion: reduce)
//             which collapses all animation-duration to 0.01ms.
//
// aria-hidden="true" so screen readers skip decorative placeholders.
//
// Usage:
//   <Skeleton className="h-4 w-48" />          ← text line
//   <Skeleton className="h-24 w-full" />        ← card block
//   <Skeleton className="h-10 w-10 rounded-full" />  ← avatar circle

const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    aria-hidden="true"
    className={cn(
      // Base shape + colour
      'rounded-md',
      // Shimmer gradient background — sweeps left → right
      'bg-gradient-to-r from-[var(--bg-surface-hover)] via-[var(--bg-surface-secondary)] to-[var(--bg-surface-hover)]',
      'bg-[length:200%_100%]',
      'animate-shimmer',
      className,
    )}
    {...props}
  />
));
Skeleton.displayName = 'Skeleton';

export { Skeleton };
