'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@shared/utils/cn';
import type { Toast as ToastType } from '@shared/types';

interface ToastProps {
  toast: ToastType;
}

const variantConfig = {
  success: {
    icon: CheckCircle2,
    containerClass: 'border-[var(--color-success)]/20 bg-[var(--bg-surface)]',
    iconClass: 'text-[var(--color-success)]',
    barClass: 'bg-[var(--color-success)]',
  },
  error: {
    icon: XCircle,
    containerClass: 'border-[var(--color-error)]/20 bg-[var(--bg-surface)]',
    iconClass: 'text-[var(--color-error)]',
    barClass: 'bg-[var(--color-error)]',
  },
  warning: {
    icon: AlertTriangle,
    containerClass: 'border-[var(--color-warning)]/20 bg-[var(--bg-surface)]',
    iconClass: 'text-[var(--color-warning)]',
    barClass: 'bg-[var(--color-warning)]',
  },
  info: {
    icon: Info,
    containerClass: 'border-[var(--color-info)]/20 bg-[var(--bg-surface)]',
    iconClass: 'text-[var(--color-info)]',
    barClass: 'bg-[var(--color-info)]',
  },
};

export function Toast({ toast }: ToastProps) {
  const t = useTranslations('common');
  const config = variantConfig[toast.variant ?? 'info'];
  const Icon = config.icon;
  const duration = toast.duration ?? 4000;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: '100%', scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: '100%', scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      role="alert"
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'relative w-80 rounded-xl border shadow-lg overflow-hidden pointer-events-auto',
        config.containerClass
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon size={18} className={cn('shrink-0 mt-0.5', config.iconClass)} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="font-medium text-sm text-[var(--color-text-primary)]">{toast.title}</p>
          )}
          {toast.description && (
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{toast.description}</p>
          )}
        </div>
        <button
          onClick={toast.onDismiss}
          aria-label={t('dismiss')}
          className="p-0.5 rounded-md text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] shrink-0"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      {/* Auto-dismiss progress bar */}
      <motion.div
        className={cn('absolute bottom-0 left-0 h-0.5', config.barClass)}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

// ─── ToastContainer ───────────────────────────────────────────────────────────

import { useUIStore } from '@/store/ui.store';

/**
 * Renders all active toasts from the UI store.
 * Mount once at the root layout.
 */
export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 sm:bottom-6 sm:right-6 pointer-events-none"
    >
      <AnimatePresence mode="sync">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t as ToastType & { variant?: string }} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
