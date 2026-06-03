'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@shared/utils/cn';

// ─── Size Variants ────────────────────────────────────────────────────────────

const avatarVariants = cva(
  'relative flex shrink-0 overflow-hidden rounded-full',
  {
    variants: {
      size: {
        xs:   'h-6 w-6 text-[10px]',
        sm:   'h-8 w-8 text-xs',
        md:   'h-10 w-10 text-sm',
        lg:   'h-12 w-12 text-base',
        xl:   'h-16 w-16 text-lg',
        '2xl':'h-20 w-20 text-xl',
      },
    },
    defaultVariants: { size: 'md' },
  }
);

// ─── Role Color Variants ──────────────────────────────────────────────────────
// NOTE: The prop is named `avatarRole` (not `role`) to avoid clashing with the
// native HTML `role` attribute (AriaRole) that Radix forwards on the fallback
// element. TypeScript strict mode raises TS2320 when two interface bases define
// a property with the same name but different types.

const avatarFallbackVariants = cva(
  [
    'flex h-full w-full items-center justify-center rounded-full',
    'font-semibold leading-none select-none',
    'transition-colors duration-[var(--transition-base)]',
  ],
  {
    variants: {
      avatarRole: {
        student: 'bg-[color-mix(in_srgb,var(--role-student)_15%,transparent)] text-[var(--role-student)]',
        teacher: 'bg-[color-mix(in_srgb,var(--role-teacher)_15%,transparent)] text-[var(--role-teacher)]',
        admin:   'bg-[color-mix(in_srgb,var(--role-admin)_15%,transparent)]   text-[var(--role-admin)]',
        owner:   'bg-[color-mix(in_srgb,var(--role-owner)_15%,transparent)]   text-[var(--role-owner)]',
        default: 'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)]',
      },
    },
    defaultVariants: { avatarRole: 'default' },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

type AvatarVariants        = VariantProps<typeof avatarVariants>;
type AvatarFallbackVariants = VariantProps<typeof avatarFallbackVariants>;

export interface AvatarProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    AvatarVariants {}

// AvatarFallbackProps deliberately does NOT extend AvatarFallbackVariants via
// interface extension — we spread the variant fields manually to avoid the
// TS2320 conflict with `role: AriaRole` from the Radix element type.
export interface AvatarFallbackProps
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> {
  /** Role-based background / text colour for the initials fallback. */
  avatarRole?: AvatarFallbackVariants['avatarRole'];
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(avatarVariants({ size }), className)}
    {...props}
  />
));
Avatar.displayName = 'Avatar';

// ─── AvatarImage ──────────────────────────────────────────────────────────────

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, alt = '', ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    alt={alt}
    className={cn('aspect-square h-full w-full object-cover', className)}
    {...props}
  />
));
AvatarImage.displayName = 'AvatarImage';

// ─── AvatarFallback ───────────────────────────────────────────────────────────

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, avatarRole, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(avatarFallbackVariants({ avatarRole }), className)}
    delayMs={0}
    {...props}
  />
));
AvatarFallback.displayName = 'AvatarFallback';

// ─── AvatarGroup ─────────────────────────────────────────────────────────────

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: AvatarVariants['size'];
  children: React.ReactNode;
}

const AvatarGroup = React.forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ className, children, max = 4, ...props }, ref) => {
    const childArray = React.Children.toArray(children);
    const visible    = childArray.slice(0, max);
    const overflow   = childArray.length - max;

    return (
      <div
        ref={ref}
        className={cn('flex -space-x-2', className)}
        aria-label={`${childArray.length} users`}
        {...props}
      >
        {visible.map((child, i) => (
          <div key={i} className="ring-2 ring-[var(--bg-surface)] rounded-full">
            {child}
          </div>
        ))}

        {overflow > 0 && (
          <div
            className="ring-2 ring-[var(--bg-surface)] rounded-full"
            aria-label={`+${overflow} more`}
          >
            <Avatar>
              <AvatarFallback avatarRole="default">
                +{overflow}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    );
  }
);
AvatarGroup.displayName = 'AvatarGroup';

// ─── Exports ──────────────────────────────────────────────────────────────────

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarGroup,
  avatarVariants,
  avatarFallbackVariants,
};
export type { AvatarVariants, AvatarFallbackVariants };