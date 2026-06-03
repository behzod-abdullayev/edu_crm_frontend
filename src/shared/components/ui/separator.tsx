'use client';

import * as React from 'react';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '@shared/utils/cn';

// ─── Separator ────────────────────────────────────────────────────────────────
//
// Thin visual divider — horizontal (default) or vertical.
// Uses CSS variable --border-default so it adapts to light / dark themes.
// Accessible: `decorative={true}` (default) means screen readers skip it;
// set `decorative={false}` when the separator has semantic meaning.
//
// Usage:
//   <Separator />                     ← horizontal, full-width
//   <Separator orientation="vertical" className="h-6" />
//   <Separator decorative={false} />  ← semantic (role="separator" exposed)

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = 'horizontal', decorative = true, ...props },
    ref,
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        'shrink-0 bg-border-default',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      {...props}
    />
  ),
);
Separator.displayName = SeparatorPrimitive.Root.displayName;

export { Separator };
