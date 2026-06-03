'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, X } from 'lucide-react';
import { cn } from '@shared/utils/cn';

// ─── Input Variants ───────────────────────────────────────────────────────────

const inputVariants = cva(
  [
    // Base
    'flex w-full rounded-[var(--radius-md)] border bg-[var(--bg-surface)]',
    'text-sm text-[var(--text-primary)]',
    'placeholder:text-[var(--text-muted)]',
    // Focus ring
    'outline-none transition-[border-color,box-shadow]',
    'duration-[var(--transition-fast)]',
    'focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-0',
    'focus-visible:border-[var(--border-focus)]',
    // Disabled
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--bg-surface-secondary)]',
    // File input reset
    'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--text-primary)]',
    // Read-only
    'read-only:cursor-default read-only:bg-[var(--bg-surface-secondary)]',
  ],
  {
    variants: {
      inputState: {
        default: [
          'border-[var(--border-default)]',
          'hover:border-[var(--border-strong)]',
        ],
        error: [
          'border-[var(--error-border)]',
          'hover:border-[var(--error-border)]',
          'focus-visible:ring-[var(--error-solid)]',
          'focus-visible:border-[var(--error-border)]',
        ],
        success: [
          'border-[var(--success-border)]',
          'hover:border-[var(--success-border)]',
          'focus-visible:ring-[var(--success-solid)]',
          'focus-visible:border-[var(--success-border)]',
        ],
        warning: [
          'border-[var(--warning-border)]',
          'hover:border-[var(--warning-border)]',
          'focus-visible:ring-[var(--warning-solid)]',
          'focus-visible:border-[var(--warning-border)]',
        ],
      },
      /** Height tier — mobile minimum 44px for all tappable fields */
      inputSize: {
        sm:  'h-8 px-2.5 text-xs',
        md:  'h-11 px-3',          // 44px — mobile minimum tap target
        lg:  'h-12 px-4 text-base',
        xl:  'h-14 px-4 text-base',
      },
      /** Whether left/right addon slots are active (adjusts padding) */
      hasLeft:  { true: 'pl-10',  false: '' },
      hasRight: { true: 'pr-10',  false: '' },
    },
    defaultVariants: {
      inputState: 'default',
      inputSize:  'md',
      hasLeft:    false,
      hasRight:   false,
    },
  }
);

// ─── Types ────────────────────────────────────────────────────────────────────

type InputVariants = VariantProps<typeof inputVariants>;

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    Omit<InputVariants, 'hasLeft' | 'hasRight'> {
  /** Mapped to inputState='error'. Automatically sets aria-invalid. */
  hasError?: boolean;
  /** Success state */
  hasSuccess?: boolean;
  /** Warning state */
  hasWarning?: boolean;
  /** Element rendered inside the left slot (icon, currency symbol, etc.) */
  leftAddon?: React.ReactNode;
  /** Element rendered inside the right slot (icon, unit label, etc.) */
  rightAddon?: React.ReactNode;
  /** When true (and type="password"), a show/hide toggle button is rendered */
  showPasswordToggle?: boolean;
  /** When true, renders a clear (×) button when the input has a value */
  clearable?: boolean;
  /** Called when the clear button is pressed */
  onClear?: () => void;
}

// ─── Derive inputState from boolean props ─────────────────────────────────────

function resolveState(
  hasError?: boolean,
  hasSuccess?: boolean,
  hasWarning?: boolean,
  explicit?: InputVariants['inputState']
): InputVariants['inputState'] {
  if (hasError)   return 'error';
  if (hasWarning) return 'warning';
  if (hasSuccess) return 'success';
  return explicit ?? 'default';
}

// ─── Input ────────────────────────────────────────────────────────────────────

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      inputState,
      inputSize = 'md',
      hasError,
      hasSuccess,
      hasWarning,
      leftAddon,
      rightAddon,
      showPasswordToggle = false,
      clearable = false,
      onClear,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const resolvedState = resolveState(hasError, hasSuccess, hasWarning, inputState);
    const isPassword    = type === 'password';
    const inputType     = isPassword && showPassword ? 'text' : type;

    const hasRightSlot = Boolean(rightAddon) || (isPassword && showPasswordToggle) || clearable;

    // ── Inline clear handler ───────────────────────────────────────────────────
    const handleClear = React.useCallback(() => {
      onClear?.();
      // Also dispatch a synthetic event so RHF / uncontrolled inputs work
    }, [onClear]);

    const showClearBtn = clearable && value !== undefined && String(value).length > 0;

    return (
      <div className="relative flex w-full items-center">
        {/* Left addon */}
        {leftAddon && (
          <div
            className={cn(
              'pointer-events-none absolute left-0 flex h-full items-center pl-3',
              'text-[var(--text-muted)]'
            )}
            aria-hidden="true"
          >
            {leftAddon}
          </div>
        )}

        {/* Native input */}
        <input
          ref={ref}
          type={inputType}
          value={value}
          onChange={onChange}
          aria-invalid={hasError ?? undefined}
          aria-required={props.required}
          className={cn(
            inputVariants({
              inputState: resolvedState,
              inputSize,
              hasLeft:  Boolean(leftAddon),
              hasRight: hasRightSlot,
            }),
            className
          )}
          {...props}
        />

        {/* Right addon area */}
        {hasRightSlot && (
          <div
            className="absolute right-0 flex h-full items-center gap-0.5 pr-2.5"
            aria-hidden={!(isPassword && showPasswordToggle) && !showClearBtn}
          >
            {/* Custom right addon (read-only decoration) */}
            {rightAddon && !showPasswordToggle && !showClearBtn && (
              <span className="pointer-events-none text-[var(--text-muted)]">
                {rightAddon}
              </span>
            )}

            {/* Clear button */}
            <AnimatePresence mode="wait">
              {showClearBtn && (
                <motion.button
                  key="clear"
                  type="button"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleClear}
                  aria-label="Clear input"
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full',
                    'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                    'hover:bg-[var(--bg-surface-hover)]',
                    'transition-colors duration-[var(--transition-fast)]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]'
                  )}
                >
                  <X size={12} aria-hidden="true" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Password toggle */}
            {isPassword && showPasswordToggle && (
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded',
                  'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  'transition-colors duration-[var(--transition-fast)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]'
                )}
              >
                {showPassword ? (
                  <EyeOff size={15} aria-hidden="true" />
                ) : (
                  <Eye size={15} aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─── Textarea ─────────────────────────────────────────────────────────────────

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    Pick<InputVariants, 'inputState'> {
  hasError?: boolean;
  hasSuccess?: boolean;
  hasWarning?: boolean;
  /** Auto-grow to fit content (default: false) */
  autoGrow?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      inputState,
      hasError,
      hasSuccess,
      hasWarning,
      autoGrow = false,
      onChange,
      ...props
    },
    ref
  ) => {
    const resolvedState = resolveState(hasError, hasSuccess, hasWarning, inputState);
    const internalRef = React.useRef<HTMLTextAreaElement>(null);

    // Merge refs
    React.useImperativeHandle(ref, () => internalRef.current!);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoGrow && internalRef.current) {
        internalRef.current.style.height = 'auto';
        internalRef.current.style.height = `${internalRef.current.scrollHeight}px`;
      }
      onChange?.(e);
    };

    return (
      <textarea
        ref={internalRef}
        aria-invalid={hasError ?? undefined}
        aria-required={props.required}
        onChange={handleChange}
        className={cn(
          // Shared input base styles
          'flex w-full rounded-[var(--radius-md)] border bg-[var(--bg-surface)]',
          'px-3 py-2.5 text-sm text-[var(--text-primary)] leading-relaxed',
          'placeholder:text-[var(--text-muted)]',
          'outline-none transition-[border-color,box-shadow] duration-[var(--transition-fast)]',
          'focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:border-[var(--border-focus)]',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--bg-surface-secondary)]',
          'resize-vertical min-h-[88px]',
          autoGrow && 'resize-none overflow-hidden',
          // State
          resolvedState === 'default' && 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
          resolvedState === 'error'   && 'border-[var(--error-border)]   focus-visible:ring-[var(--error-solid)]',
          resolvedState === 'success' && 'border-[var(--success-border)] focus-visible:ring-[var(--success-solid)]',
          resolvedState === 'warning' && 'border-[var(--warning-border)] focus-visible:ring-[var(--warning-solid)]',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

// ─── Exports ──────────────────────────────────────────────────────────────────

export { Input, Textarea, inputVariants };
export type { InputVariants };