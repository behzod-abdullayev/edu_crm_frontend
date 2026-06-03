'use client';

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
      className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}
      role="status"
      aria-live="polite"
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-subtle)] flex items-center justify-center mb-4">
        <Icon size={28} className="text-[var(--color-accent)]" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--color-text-muted)] max-w-xs">{description}</p>
      )}
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={action.onClick}
          className="mt-5 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-dark)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}

// ─── ErrorState ──────────────────────────────────────────────────────────────

interface ErrorStateProps {
  error?: Error;
  title?: string;
  onRetry?: () => void;
  className?: string | undefined;
}

export function ErrorState({ error, title, onRetry, className }: ErrorStateProps) {
  const t = useTranslations('errors');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex flex-col items-center justify-center text-center py-12 px-6', className)}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-error)]/10 flex items-center justify-center mb-4">
        <AlertTriangle size={28} className="text-[var(--color-error)]" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
        {title ?? t('somethingWentWrong')}
      </h3>
      {error?.message && (
        <p className="text-sm text-[var(--color-text-muted)] max-w-sm font-mono bg-[var(--bg-table-header)] px-3 py-2 rounded-lg mt-1">
          {error.message}
        </p>
      )}
      {onRetry && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onRetry}
          className="mt-5 flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)] text-sm font-medium hover:bg-[var(--bg-sidebar-item-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        >
          <RefreshCw size={14} aria-hidden="true" />
          {t('retry')}
        </motion.button>
      )}
    </motion.div>
  );
}
