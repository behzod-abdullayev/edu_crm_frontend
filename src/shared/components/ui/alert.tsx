'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  X,
} from 'lucide-react';
import { cn } from '@shared/utils/cn';

// ─── Variants ─────────────────────────────────────────────────────────────────

const alertVariants = cva(
  [
    'relative flex items-start gap-3 rounded-xl border p-4',
    'transition-colors duration-[var(--transition-base)]',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-[var(--border-default)]',
          'bg-[var(--bg-surface)]',
          'text-[var(--text-primary)]',
        ],
        destructive: [
          'border-[var(--error-border)]',
          'bg-[var(--error-bg)]',
          'text-[var(--error-text)]',
        ],
        success: [
          'border-[var(--success-border)]',
          'bg-[var(--success-bg)]',
          'text-[var(--success-text)]',
        ],
        warning: [
          'border-[var(--warning-border)]',
          'bg-[var(--warning-bg)]',
          'text-[var(--warning-text)]',
        ],
        info: [
          'border-[var(--info-border)]',
          'bg-[var(--info-bg)]',
          'text-[var(--info-text)]',
        ],
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const ALERT_ICONS = {
  default:     Info,
  destructive: XCircle,
  success:     CheckCircle2,
  warning:     AlertTriangle,
  info:        Info,
} as const satisfies Record<NonNullable<AlertVariants['variant']>, React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: 'true' }>>;

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertVariants = VariantProps<typeof alertVariants>;

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    AlertVariants {
  /** When true an × button appears and the alert can be dismissed. */
  dismissible?: boolean;
  /** Callback fired when the × button is clicked. */
  onDismiss?: () => void;
}

// ─── Alert ────────────────────────────────────────────────────────────────────

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = 'default',
      dismissible = false,
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = React.useState(true);

    const handleDismiss = React.useCallback(() => {
      setVisible(false);
      onDismiss?.();
    }, [onDismiss]);

    const Icon = ALERT_ICONS[variant ?? 'default'];

    return (
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <div
              ref={ref}
              role="alert"
              aria-live="polite"
              aria-atomic="true"
              className={cn(alertVariants({ variant }), className)}
              {...props}
            >
              {/* Leading icon */}
              <Icon
                size={18}
                className="mt-0.5 shrink-0"
                aria-hidden="true"
              />

              {/* Content */}
              <div className="flex-1 min-w-0">{children}</div>

              {/* Dismiss button */}
              {dismissible && (
                <button
                  type="button"
                  onClick={handleDismiss}
                  aria-label="Dismiss alert"
                  className={cn(
                    'ml-auto -mr-1 -mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                    'transition-colors duration-[var(--transition-fast)]',
                    'hover:bg-black/10 dark:hover:bg-white/10',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1'
                  )}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }
);
Alert.displayName = 'Alert';

// ─── AlertTitle ───────────────────────────────────────────────────────────────

const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      'mb-1 font-semibold leading-none tracking-tight text-sm',
      className
    )}
    {...props}
  />
));
AlertTitle.displayName = 'AlertTitle';

// ─── AlertDescription ─────────────────────────────────────────────────────────

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm leading-relaxed opacity-90', className)}
    {...props}
  />
));
AlertDescription.displayName = 'AlertDescription';

// ─── Exports ──────────────────────────────────────────────────────────────────

export { Alert, AlertTitle, AlertDescription, alertVariants };
export type { AlertVariants };