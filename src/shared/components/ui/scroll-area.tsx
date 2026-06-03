'use client';

import * as React from 'react';
import { cn } from '@shared/utils/cn';

// ─── ScrollArea ───────────────────────────────────────────────────────────────
// NOTE: @radix-ui/react-scroll-area is not in package.json.
// Native div-based implementation — functionally equivalent.

export const ScrollArea = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: 'vertical' | 'horizontal' }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('relative overflow-auto', className)}
    {...props}
  >
    {children}
  </div>
));
ScrollArea.displayName = 'ScrollArea';

// ─── ScrollBar ────────────────────────────────────────────────────────────────

export const ScrollBar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { orientation?: 'vertical' | 'horizontal' }
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical' &&
        'h-full w-2.5 border-l border-l-transparent p-[1px]',
      orientation === 'horizontal' &&
        'h-2.5 flex-col border-t border-t-transparent p-[1px]',
      className
    )}
    {...props}
  />
));
ScrollBar.displayName = 'ScrollBar';