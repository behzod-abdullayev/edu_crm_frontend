'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@shared/utils/cn';

// ─── Button ──────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
    'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.97] transition-transform',
  ],
  {
    variants: {
      variant: {
        default: 'bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]',
        destructive: 'bg-[var(--error-solid)] text-white hover:opacity-90',
        outline: 'border border-[var(--border-default)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
        secondary: 'bg-[var(--bg-surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
        ghost: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
        link: 'bg-transparent text-[var(--brand-primary)] underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, asChild = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={!asChild ? (disabled || isLoading) : undefined}
        aria-busy={!asChild ? isLoading : undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {isLoading && <Loader2 size={14} className="animate-spin shrink-0" aria-hidden="true" />}
            {children}
          </>
        )}
      </Comp>
    );
  }
);
Button.displayName = 'Button';

// ─── Input ───────────────────────────────────────────────────────────────────

const inputVariants = cva(
  [
    'flex w-full rounded-lg border bg-[var(--bg-surface)] px-3 text-sm text-[var(--text-primary)]',
    'placeholder:text-[var(--text-muted)]',
    'transition-colors outline-none',
    'focus:ring-2 focus:ring-[var(--border-focus)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
  ],
  {
    variants: {
      state: {
        default: 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
        error: 'border-[var(--error-solid)] focus:ring-[var(--error-solid)]',
      },
      inputSize: {
        sm: 'h-8 text-xs',
        md: 'h-10',
        lg: 'h-12 text-base',
      },
    },
    defaultVariants: { state: 'default', inputSize: 'md' },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, state, inputSize, hasError, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(inputVariants({ state: hasError ? 'error' : state, inputSize }), className)}
      aria-invalid={hasError}
      {...props}
    />
  )
);
Input.displayName = 'Input';

// ─── Label ───────────────────────────────────────────────────────────────────

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, children, required, ...props }, ref) => (
    <label
      ref={ref}
      className={cn('text-sm font-medium text-[var(--text-primary)] leading-none', className)}
      {...props}
    >
      {children}
      {required && (
        <span className="text-[var(--error-solid)] ml-0.5" aria-label="required">*</span>
      )}
    </label>
  )
);
Label.displayName = 'Label';

// ─── Badge ───────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--brand-primary)] text-white',
        secondary: 'bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]',
        destructive: 'bg-[var(--error-bg)] text-[var(--error-text)]',
        success: 'bg-[var(--success-bg)] text-[var(--success-text)]',
        warning: 'bg-[var(--warning-bg)] text-[var(--warning-text)]',
        error: 'bg-[var(--error-bg)] text-[var(--error-text)]',
        info: 'bg-[var(--info-bg)] text-[var(--info-text)]',
        outline: 'border border-[var(--border-default)] text-[var(--text-secondary)] bg-transparent',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
  )
);
Badge.displayName = 'Badge';

// ─── Card ────────────────────────────────────────────────────────────────────

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl shadow-sm', className)}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold text-[var(--text-primary)] leading-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-[var(--text-muted)]', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 pb-6', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center px-6 pt-0 pb-6 gap-3', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';