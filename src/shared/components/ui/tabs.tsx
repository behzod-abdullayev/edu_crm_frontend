'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@shared/utils/cn';

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'relative inline-flex items-center gap-1 rounded-xl bg-[var(--bg-table-header)] p-1',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & { isActive?: boolean }
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-sm font-medium',
      'text-[var(--color-text-muted)] transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
      'disabled:pointer-events-none disabled:opacity-50',
      'data-[state=active]:text-[var(--color-text-primary)]',
      className
    )}
    {...props}
  >
    {/* Animated background indicator */}
    <TabsPrimitive.Trigger
      data-state={(props as Record<string, unknown>)['data-state'] as string | undefined}
      className="absolute inset-0 rounded-lg data-[state=active]:block hidden"
      aria-hidden="true"
      tabIndex={-1}
      {...props}
    />
    <span className="relative z-10">{children}</span>
  </TabsPrimitive.Trigger>
));
TabsTrigger.displayName = 'TabsTrigger';

// Animated version using layoutId for smooth indicator
export const AnimatedTabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & { activeValue?: string }
>(({ className, children, activeValue: _activeValue, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'relative inline-flex items-center gap-1 border-b border-[var(--color-border)] pb-0',
      className
    )}
    {...props}
  >
    {children}
  </TabsPrimitive.List>
));
AnimatedTabsList.displayName = 'AnimatedTabsList';

export const AnimatedTabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'relative px-4 pb-3 pt-1 text-sm font-medium transition-colors',
      'text-[var(--color-text-muted)] data-[state=active]:text-[var(--color-text-primary)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] rounded-t-lg',
      'disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  >
    {children}
    {/* Active underline indicator with layoutId for smooth transition */}
    <TabsPrimitive.Trigger
      data-state={(props as Record<string, unknown>)['data-state'] as string | undefined}
      tabIndex={-1}
      aria-hidden="true"
      className="sr-only"
      {...props}
    />
  </TabsPrimitive.Trigger>
));
AnimatedTabsTrigger.displayName = 'AnimatedTabsTrigger';

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 ring-offset-[var(--bg-surface)]',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';
