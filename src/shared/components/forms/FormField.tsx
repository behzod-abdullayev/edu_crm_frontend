'use client';

import { useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@shared/utils/cn';

interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

export function FormField({
  label,
  error,
  required,
  description,
  children,
  htmlFor,
  className,
}: FormFieldProps) {
  const descId = useId();
  const errorId = useId();

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-[var(--color-text-primary)]"
      >
        {label}
        {required && (
          <span
            className="text-[var(--color-error)] ml-0.5"
            aria-label="required"
          >
            *
          </span>
        )}
      </label>

      {description && (
        <p id={descId} className="text-xs text-[var(--color-text-muted)]">
          {description}
        </p>
      )}

      {/* Clones children with aria-describedby props */}
      <div
        aria-describedby={
          [description && descId, error && errorId].filter(Boolean).join(' ') || undefined
        }
      >
        {children}
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.18 }}
            className="text-xs text-[var(--color-error)] overflow-hidden"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
