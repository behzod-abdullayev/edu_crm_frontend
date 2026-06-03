'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { motion } from 'framer-motion';
import { cn } from '@shared/utils/cn';

// ─── Progress ─────────────────────────────────────────────────────────────────

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  /**
   * Optional color override for the indicator.
   * Defaults to var(--color-accent).
   */
  indicatorClassName?: string;
}

export const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, indicatorClassName, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-2 w-full overflow-hidden rounded-full',
      'bg-[var(--color-skeleton)]',
      className
    )}
    value={value}
    {...props}
  >
    <ProgressPrimitive.Indicator asChild>
      {/* Framer Motion animated fill — respects prefers-reduced-motion via CSS */}
      <motion.div
        className={cn(
          'h-full rounded-full bg-[var(--color-accent)]',
          indicatorClassName
        )}
        initial={{ width: 0 }}
        animate={{ width: `${value ?? 0}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        aria-hidden="true"
      />
    </ProgressPrimitive.Indicator>
  </ProgressPrimitive.Root>
));
Progress.displayName = 'Progress';
