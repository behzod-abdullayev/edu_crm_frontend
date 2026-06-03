'use client';

import * as React from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import { motion } from 'framer-motion';
import { cn } from '@shared/utils/cn';

// ─── Switch ───────────────────────────────────────────────────────────────────
//
// Toggle switch built on @radix-ui/react-switch.
// The thumb is animated with Framer Motion spring physics so the
// slide animation is smooth and tactile — matching the prompt requirement
// for every interactive element to have animation.
//
// Accessibility:
//   • Inherits Radix role="switch" and aria-checked automatically
//   • Keyboard: Space / Enter toggles; Tab reaches it
//   • Focus ring uses --border-focus CSS variable
//
// Theming:
//   OFF state: bg-[var(--border-default)]        (neutral grey track)
//   ON  state: bg-[var(--brand-primary)]          (indigo track)
//   Thumb:     white, 20 × 20 px, drop-shadow-sm
//
// Usage:
//   <Switch />
//   <Switch defaultChecked />
//   <Switch checked={isOn} onCheckedChange={setIsOn} disabled />
//
// With label (using Label from ui/label):
//   <div className="flex items-center gap-2">
//     <Switch id="notif" />
//     <Label htmlFor="notif">Enable notifications</Label>
//   </div>

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      // Track
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full',
      'border-2 border-transparent',
      // Colour states — unchecked → muted border colour, checked → brand primary
      'bg-[var(--border-default)] data-[state=checked]:bg-[var(--brand-primary)]',
      // Colour transition
      'transition-colors duration-200 ease-in-out',
      // Focus ring
      'focus-visible:outline-none focus-visible:ring-2',
      'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
      'focus-visible:ring-offset-[var(--bg-surface)]',
      // Disabled
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb asChild>
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.8 }}
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white',
          'shadow-sm ring-0',
          // Radix translates the thumb via data-state — Framer Motion layout
          // animates the actual position change for smooth spring physics.
          'data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0',
        )}
      />
    </SwitchPrimitive.Thumb>
  </SwitchPrimitive.Root>
));
Switch.displayName = SwitchPrimitive.Root.displayName;

export { Switch };
