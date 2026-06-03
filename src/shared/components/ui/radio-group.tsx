'use client';

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/utils/cn';

// ─── RadioGroup ──────────────────────────────────────────────────────────────

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn('flex flex-col gap-2', className)}
    {...props}
  />
));
RadioGroup.displayName = 'RadioGroup';

// ─── RadioGroupItem ───────────────────────────────────────────────────────────

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      // base size + shape
      'aspect-square h-5 w-5 rounded-full',
      // border
      'border border-[var(--color-border)] transition-colors',
      'hover:border-[var(--color-accent)]',
      // checked state border
      'data-[state=checked]:border-[var(--color-accent)]',
      // focus ring
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]',
      // disabled
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <AnimatePresence>
        <motion.span
          key="radio-dot"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="block h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]"
          aria-hidden="true"
        />
      </AnimatePresence>
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = 'RadioGroupItem';
