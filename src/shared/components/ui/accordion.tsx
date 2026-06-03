'use client';

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { ChevronDown, AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '@shared/utils/cn';

// ─── Accordion ───────────────────────────────────────────────────────────────

export const Accordion      = AccordionPrimitive.Root;
export const AccordionItem  = AccordionPrimitive.Item;

export const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex flex-1 items-center justify-between py-4 text-sm font-medium text-[var(--color-text-primary)]',
        'transition-colors hover:text-[var(--color-accent)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] rounded',
        '[&[data-state=open]>svg]:rotate-180',
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown
        size={16}
        className="text-[var(--color-text-muted)] transition-transform duration-200 shrink-0"
        aria-hidden="true"
      />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = 'AccordionTrigger';

export const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      'overflow-hidden text-sm text-[var(--color-text-secondary)]',
      'data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
      className
    )}
    {...props}
  >
    <div className="pb-4 pt-0">{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = 'AccordionContent';

// ─── Alert ───────────────────────────────────────────────────────────────────

const alertVariants = cva(
  'relative flex items-start gap-3 rounded-xl border p-4',
  {
    variants: {
      variant: {
        default:     'border-[var(--color-border)] bg-[var(--bg-card)] text-[var(--color-text-primary)]',
        destructive: 'border-[var(--color-error)]/20 bg-[var(--color-error)]/5 text-[var(--color-error)]',
        success:     'border-[var(--color-success)]/20 bg-[var(--color-success)]/5 text-[var(--color-success)]',
        warning:     'border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5 text-[var(--color-warning)]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

const alertIcons = {
  default:     Info,
  destructive: XCircle,
  success:     CheckCircle2,
  warning:     AlertTriangle,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const Icon = alertIcons[variant ?? 'default'];
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <Icon size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    );
  }
);
Alert.displayName = 'Alert';

export const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('font-medium leading-none tracking-tight mb-1', className)} {...props} />
  )
);
AlertTitle.displayName = 'AlertTitle';

export const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm opacity-90 leading-relaxed', className)} {...props} />
  )
);
AlertDescription.displayName = 'AlertDescription';

// ─── AlertDialog ─────────────────────────────────────────────────────────────

export const AlertDialog          = AlertDialogPrimitive.Root;
export const AlertDialogTrigger   = AlertDialogPrimitive.Trigger;
export const AlertDialogPortal    = AlertDialogPrimitive.Portal;
export const AlertDialogCancel    = AlertDialogPrimitive.Cancel;
export const AlertDialogAction    = AlertDialogPrimitive.Action;

export const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
AlertDialogOverlay.displayName = 'AlertDialogOverlay';

export const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Portal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
        'w-full max-w-md bg-[var(--bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 shadow-2xl',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        className
      )}
      {...props}
    />
  </AlertDialogPrimitive.Portal>
));
AlertDialogContent.displayName = 'AlertDialogContent';

export const AlertDialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-2 mb-5', className)} {...props} />
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

export const AlertDialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-end gap-3 mt-6', className)} {...props} />
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

export const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold text-[var(--color-text-primary)]', className)}
    {...props}
  />
));
AlertDialogTitle.displayName = 'AlertDialogTitle';

export const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-[var(--color-text-muted)]', className)}
    {...props}
  />
));
AlertDialogDescription.displayName = 'AlertDialogDescription';
