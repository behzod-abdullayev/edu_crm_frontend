'use client';

// src/shared/components/data-display/EmptyState.tsx
// ✅ FIX: Translation key corrected from 'somethingWentWrong' → 'somethingWrong'
//         Also added fallbacks for CSS variables that may not exist in all themes

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { InboxIcon, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import type { LucideIcon } from 'lucide-react';

// ─── EmptyState ──────────────────────────────────────────────────────────────

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string | undefined;
}

export function EmptyState({
  icon: Icon = InboxIcon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface-secondary)] flex items-center justify-center mb-4">
        <Icon
          size={28}
          className="text-[var(--text-muted)]"
          aria-hidden="true"
        />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--text-muted)] max-w-xs">
          {description}
        </p>
      )}
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={action.onClick}
          className="mt-5 px-4 py-2 rounded-lg bg-[var(--brand-primary)] text-[var(--text-on-brand)] text-sm font-medium hover:bg-[var(--brand-primary-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

// ─── ErrorState ──────────────────────────────────────────────────────────────

interface ErrorStateProps {
  error?: Error | string;
  title?: string;
  onRetry?: () => void;
  className?: string | undefined;
}

export function ErrorState({
  error,
  title,
  onRetry,
  className,
}: ErrorStateProps) {
  const t = useTranslations('errors');

  // ✅ FIX: Use the correct translation key 'somethingWrong' (not 'somethingWentWrong')
  const defaultTitle = t('somethingWrong');

  const errorMessage =
    typeof error === 'string'
      ? error
      : error instanceof Error
      ? error.message
      : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        className,
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--error-bg)] flex items-center justify-center mb-4">
        <AlertTriangle
          size={28}
          className="text-[var(--error-solid)]"
          aria-hidden="true"
        />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
        {title ?? defaultTitle}
      </h3>
      {errorMessage && (
        <p className="text-sm text-[var(--text-muted)] max-w-sm font-mono bg-[var(--bg-surface-secondary)] px-3 py-2 rounded-lg mt-1 break-words">
          {errorMessage}
        </p>
      )}
      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRetry}
          className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-default)] text-[var(--text-primary)] text-sm font-medium hover:bg-[var(--bg-surface-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
        >
          <RefreshCw size={14} aria-hidden="true" />
          {/* ✅ FIX: Fallback text in case translation also fails */}
          {(() => {
            try {
              return t('retry');
            } catch {
              return 'Retry';
            }
          })()}
        </motion.button>
      )}
    </motion.div>
  );
}
