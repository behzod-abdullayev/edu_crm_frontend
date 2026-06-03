'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@shared/utils/cn';

// ─── Label ───────────────────────────────────────────────────────────────────

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  /** Appends a red asterisk and aria-label="required" span */
  required?: boolean;
}

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(({ className, children, required, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(
      'text-sm font-medium text-[var(--color-text-primary)] leading-none',
      'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
      'select-none',
      className
    )}
    {...props}
  >
    {children}
    {required && (
      <span
        className="text-[var(--color-error)] ml-0.5"
        aria-label="required"
      >
        *
      </span>
    )}
  </LabelPrimitive.Root>
));
Label.displayName = 'Label';
