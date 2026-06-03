'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { cn } from '@shared/utils/cn';

// ─── Variants ─────────────────────────────────────────────────────────────────

const badgeVariants = cva(
  [
    'inline-flex items-center gap-1 rounded-[var(--radius-full)]',
    'font-medium leading-none transition-colors duration-[var(--transition-fast)]',
    'whitespace-nowrap select-none',
  ],
  {
    variants: {
      /**
       * Semantic status variants (from prompt):
       *   active / paid   → success (green)
       *   pending         → warning (yellow)
       *   inactive / debt → destructive (red)   — alias: "error"
       *   info / enrolled → info (blue)
       *   draft / default → default (gray)
       */
      variant: {
        // ── Semantic status ───────────────────────────────────
        default:     'bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] border border-[var(--border-default)]',
        success:     'bg-[var(--success-bg)]  border border-[var(--success-border)]  text-[var(--success-text)]',
        warning:     'bg-[var(--warning-bg)]  border border-[var(--warning-border)]  text-[var(--warning-text)]',
        // "destructive" is the canonical name; "error" is an alias kept for
        // backward-compat with code that uses variant="error"
        destructive: 'bg-[var(--error-bg)]    border border-[var(--error-border)]    text-[var(--error-text)]',
        error:       'bg-[var(--error-bg)]    border border-[var(--error-border)]    text-[var(--error-text)]',
        info:        'bg-[var(--info-bg)]     border border-[var(--info-border)]     text-[var(--info-text)]',

        // ── Solid variants ────────────────────────────────────
        'solid-success':     'bg-[var(--success-solid)]  text-white',
        'solid-warning':     'bg-[var(--warning-solid)]  text-white',
        'solid-destructive': 'bg-[var(--error-solid)]    text-white',
        'solid-info':        'bg-[var(--info-solid)]     text-white',
        'solid-primary':     'bg-[var(--brand-primary)]  text-[var(--text-on-brand)]',

        // ── Role badges ───────────────────────────────────────
        student: 'bg-[color-mix(in_srgb,var(--role-student)_12%,transparent)] text-[var(--role-student)] border border-[color-mix(in_srgb,var(--role-student)_30%,transparent)]',
        teacher: 'bg-[color-mix(in_srgb,var(--role-teacher)_12%,transparent)] text-[var(--role-teacher)] border border-[color-mix(in_srgb,var(--role-teacher)_30%,transparent)]',
        admin:   'bg-[color-mix(in_srgb,var(--role-admin)_12%,transparent)]   text-[var(--role-admin)]   border border-[color-mix(in_srgb,var(--role-admin)_30%,transparent)]',
        owner:   'bg-[color-mix(in_srgb,var(--role-owner)_12%,transparent)]   text-[var(--role-owner)]   border border-[color-mix(in_srgb,var(--role-owner)_30%,transparent)]',

        // ── Ghost / outline ───────────────────────────────────
        outline: 'border border-[var(--border-strong)] text-[var(--text-secondary)] bg-transparent',
      },
      size: {
        sm: 'px-1.5 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3    py-1   text-sm',
      },
      /** Dot indicator shown before the label */
      dot: {
        true:  '',
        false: '',
      },
    },
    defaultVariants: { variant: 'default', size: 'md', dot: false },
  }
);

// ─── Dot color map ────────────────────────────────────────────────────────────

const DOT_COLOR: Record<string, string> = {
  success:             'bg-[var(--success-solid)]',
  warning:             'bg-[var(--warning-solid)]',
  destructive:         'bg-[var(--error-solid)]',
  error:               'bg-[var(--error-solid)]',
  info:                'bg-[var(--info-solid)]',
  'solid-success':     'bg-white',
  'solid-warning':     'bg-white',
  'solid-destructive': 'bg-white',
  'solid-info':        'bg-white',
  'solid-primary':     'bg-white',
  student:             'bg-[var(--role-student)]',
  teacher:             'bg-[var(--role-teacher)]',
  admin:               'bg-[var(--role-admin)]',
  owner:               'bg-[var(--role-owner)]',
  default:             'bg-[var(--text-muted)]',
  outline:             'bg-[var(--text-muted)]',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeVariant = NonNullable<BadgeVariants['variant']>;
type BadgeVariants = VariantProps<typeof badgeVariants>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    Omit<BadgeVariants, 'dot'> {
  /** Show a status dot before the label. */
  dot?: boolean;
  /** When provided, the badge count bounces on change (notification badge). */
  count?: number;
}

// ─── Badge ────────────────────────────────────────────────────────────────────

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant = 'default',
      size = 'md',
      dot = false,
      count,
      children,
      ...props
    },
    ref
  ) => {
    const dotColorClass = DOT_COLOR[variant ?? 'default'] ?? DOT_COLOR['default'];

    // Count badge: animate number changes
    const prevCountRef = React.useRef<number | undefined>(count);
    const [bounce, setBounce] = React.useState(false);

    React.useEffect(() => {
      if (count !== undefined && count !== prevCountRef.current) {
        setBounce(true);
        const id = setTimeout(() => setBounce(false), 350);
        prevCountRef.current = count;
        return () => clearTimeout(id);
      }
    }, [count]);

    const inner = (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {dot && (
          <span
            aria-hidden="true"
            className={cn(
              'inline-block h-1.5 w-1.5 rounded-full shrink-0',
              dotColorClass
            )}
          />
        )}
        {children ?? (count !== undefined ? count : null)}
      </span>
    );

    if (count !== undefined) {
      return (
        <motion.span
          animate={bounce ? { scale: [1, 1.35, 0.9, 1] } : { scale: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="inline-flex"
        >
          {inner}
        </motion.span>
      );
    }

    return inner;
  }
);
Badge.displayName = 'Badge';

// ─── Status Badge (semantic shortcut) ────────────────────────────────────────

export type StudentStatus = 'active' | 'inactive' | 'pending' | 'enrolled' | 'debt' | 'paid' | 'draft';
export type PaymentStatus = 'paid' | 'pending' | 'overdue' | 'refunded' | 'partial';

const STATUS_VARIANT: Record<StudentStatus | PaymentStatus, BadgeVariant> = {
  active:   'success',
  paid:     'success',
  enrolled: 'info',
  pending:  'warning',
  partial:  'warning',
  inactive: 'destructive',
  debt:     'destructive',
  overdue:  'destructive',
  refunded: 'outline',
  draft:    'default',
};

const STATUS_LABEL: Record<StudentStatus | PaymentStatus, string> = {
  active:   'Active',
  paid:     'Paid',
  enrolled: 'Enrolled',
  pending:  'Pending',
  partial:  'Partial',
  inactive: 'Inactive',
  debt:     'Debt',
  overdue:  'Overdue',
  refunded: 'Refunded',
  draft:    'Draft',
};

export interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  status: StudentStatus | PaymentStatus;
  /** Override the label. Defaults to capitalized status string. */
  label?: string;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, label, dot = true, ...props }, ref) => (
    <Badge
      ref={ref}
      variant={STATUS_VARIANT[status]}
      dot={dot}
      role="status"
      aria-label={label ?? STATUS_LABEL[status]}
      {...props}
    >
      {label ?? STATUS_LABEL[status]}
    </Badge>
  )
);
StatusBadge.displayName = 'StatusBadge';

// ─── Role Badge ───────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'teacher' | 'admin' | 'owner';

const ROLE_LABEL: Record<UserRole, string> = {
  student: 'Student',
  teacher: 'Teacher',
  admin:   'Admin',
  owner:   'Owner',
};

export interface RoleBadgeProps extends Omit<BadgeProps, 'variant' | 'children'> {
  userRole: UserRole;
}

const RoleBadge = React.forwardRef<HTMLSpanElement, RoleBadgeProps>(
  ({ userRole, ...props }, ref) => (
    <Badge
      ref={ref}
      variant={userRole}
      aria-label={`Role: ${ROLE_LABEL[userRole]}`}
      {...props}
    >
      {ROLE_LABEL[userRole]}
    </Badge>
  )
);
RoleBadge.displayName = 'RoleBadge';

// ─── Exports ──────────────────────────────────────────────────────────────────

export { Badge, StatusBadge, RoleBadge, badgeVariants };
export type { BadgeVariants };