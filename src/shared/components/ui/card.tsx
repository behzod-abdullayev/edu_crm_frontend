'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@shared/utils/cn';

// ─── Variants ─────────────────────────────────────────────────────────────────

const cardVariants = cva(
  [
    'relative rounded-[var(--radius-xl)] border bg-[var(--bg-surface)]',
    'transition-all duration-[var(--transition-base)]',
  ],
  {
    variants: {
      variant: {
        default: 'border-[var(--border-default)] shadow-[var(--shadow-sm)]',
        flat:    'border-[var(--border-strong)] shadow-none',
        kpi:     'border-[var(--border-default)] shadow-[var(--shadow-md)]',
        accent:  'border-[var(--border-default)] shadow-[var(--shadow-sm)] border-l-4 border-l-[var(--brand-primary)]',
        danger:  'border-[var(--error-border)] bg-[var(--error-bg)] shadow-none',
        success: 'border-[var(--success-border)] bg-[var(--success-bg)] shadow-none',
        warning: 'border-[var(--warning-border)] bg-[var(--warning-bg)] shadow-none',
        info:    'border-[var(--info-border)] bg-[var(--info-bg)] shadow-none',
      },
      hoverable: {
        true:  [
          'cursor-pointer',
          'hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]',
          'active:translate-y-0 active:shadow-[var(--shadow-sm)] active:scale-[0.99]',
          '@media(prefers-reduced-motion:reduce){hover:transform-none active:transform-none}',
        ],
        false: '',
      },
      padding: {
        none: '',
        sm:   '',
        md:   '',
        lg:   '',
      },
    },
    defaultVariants: { variant: 'default', hoverable: false, padding: 'md' },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

type CardVariants = VariantProps<typeof cardVariants>;

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    CardVariants {}

// ─── Card ─────────────────────────────────────────────────────────────────────

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      hoverable = false,
      padding = 'md',
      ...rest
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, hoverable, padding }), className)}
      {...rest}
    />
  )
);
Card.displayName = 'Card';

// ─── CardHeader ───────────────────────────────────────────────────────────────

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, bordered = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col gap-1.5 px-6 pt-6 pb-4',
        bordered && 'border-b border-[var(--border-default)]',
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

// ─── CardTitle ────────────────────────────────────────────────────────────────

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-tight tracking-tight text-[var(--text-primary)]',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

// ─── CardDescription ──────────────────────────────────────────────────────────

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm leading-relaxed text-[var(--text-muted)]', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// ─── CardContent ──────────────────────────────────────────────────────────────

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, noPadding = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(!noPadding && 'px-6 pb-6', className)}
      {...props}
    />
  )
);
CardContent.displayName = 'CardContent';

// ─── CardFooter ───────────────────────────────────────────────────────────────

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, bordered = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3 px-6 pt-0 pb-6',
        bordered && 'border-t border-[var(--border-default)] pt-4',
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

// ─── CardBadge ────────────────────────────────────────────────────────────────

const CardBadge = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('absolute top-4 right-4', className)}
    {...props}
  />
));
CardBadge.displayName = 'CardBadge';

// ─── CardSkeleton ─────────────────────────────────────────────────────────────

export interface CardSkeletonProps {
  lines?: number;
  className?: string;
}

const CardSkeleton: React.FC<CardSkeletonProps> = ({ lines = 3, className }) => (
  <Card className={cn('overflow-hidden', className)} aria-hidden="true">
    <CardHeader>
      <div className="h-5 w-2/3 rounded-lg bg-[var(--border-default)] animate-pulse" />
      <div className="h-3.5 w-1/2 rounded-lg bg-[var(--border-default)] animate-pulse" />
    </CardHeader>
    <CardContent>
      <div className="flex flex-col gap-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3.5 rounded-lg bg-[var(--border-default)] animate-pulse"
            style={{ width: `${100 - i * 10}%` }}
          />
        ))}
      </div>
    </CardContent>
  </Card>
);
CardSkeleton.displayName = 'CardSkeleton';

// ─── Exports ──────────────────────────────────────────────────────────────────

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardBadge,
  CardSkeleton,
  cardVariants,
};
export type { CardVariants };