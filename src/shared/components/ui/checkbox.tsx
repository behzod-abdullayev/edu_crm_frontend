'use client';

import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Minus } from 'lucide-react';
import { cn } from '@shared/utils/cn';

// ─── Checkbox ────────────────────────────────────────────────────────────────

export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      'peer relative h-5 w-5 shrink-0 rounded-md border border-[var(--color-border)]',
      'bg-[var(--bg-surface)] transition-colors',
      'hover:border-[var(--color-accent)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-[var(--color-accent)] data-[state=checked]:border-[var(--color-accent)]',
      'data-[state=indeterminate]:bg-[var(--color-accent)] data-[state=indeterminate]:border-[var(--color-accent)]',
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
      <AnimatePresence mode="wait">
        {props.checked === 'indeterminate' ? (
          <motion.span
            key="indeterminate"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Minus size={12} strokeWidth={3} aria-hidden="true" />
          </motion.span>
        ) : (
          <motion.span
            key="checked"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Check size={12} strokeWidth={3} aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = 'Checkbox';

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

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      'aspect-square h-5 w-5 rounded-full border border-[var(--color-border)]',
      'text-[var(--color-accent)] transition-colors',
      'hover:border-[var(--color-accent)]',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:border-[var(--color-accent)]',
      className
    )}
    {...props}
  >
    <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ duration: 0.15 }}
        className="h-2.5 w-2.5 rounded-full bg-[var(--color-accent)]"
      />
    </RadioGroupPrimitive.Indicator>
  </RadioGroupPrimitive.Item>
));
RadioGroupItem.displayName = 'RadioGroupItem';

// ─── Switch ──────────────────────────────────────────────────────────────────

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent',
      'transition-colors duration-200',
      'bg-[var(--color-border)] data-[state=checked]:bg-[var(--color-accent)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-surface)]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb asChild>
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-md ring-0',
          'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
        )}
      />
    </SwitchPrimitive.Thumb>
  </SwitchPrimitive.Root>
));
Switch.displayName = 'Switch';
