'use client';

import { motion, AnimatePresence } from 'framer-motion';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { cn } from '@shared/utils/cn';

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive';
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const t = useTranslations('dialog');

  return (
    <AlertDialogPrimitive.Root open={open}>
      <AnimatePresence>
        {open && (
          <AlertDialogPrimitive.Portal forceMount>
            {/* Backdrop */}
            <AlertDialogPrimitive.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              />
            </AlertDialogPrimitive.Overlay>

            {/* Panel */}
            <AlertDialogPrimitive.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className={cn(
                  'fixed z-50 bg-[var(--bg-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl',
                  'w-[calc(100%-2rem)] max-w-md',
                  // Desktop: centered; Mobile: bottom sheet via fixed bottom
                  'bottom-4 left-1/2 -translate-x-1/2',
                  'sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2',
                  'p-6'
                )}
              >
                <AlertDialogPrimitive.Title className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                  {title}
                </AlertDialogPrimitive.Title>

                {description && (
                  <AlertDialogPrimitive.Description className="text-sm text-[var(--color-text-muted)] mb-6">
                    {description}
                  </AlertDialogPrimitive.Description>
                )}

                <div className="flex items-center gap-3 justify-end">
                  <AlertDialogPrimitive.Cancel asChild>
                    <button
                      onClick={onCancel}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--bg-sidebar-item-hover)] transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                    >
                      {cancelLabel ?? t('cancel')}
                    </button>
                  </AlertDialogPrimitive.Cancel>

                  <AlertDialogPrimitive.Action asChild>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={onConfirm}
                      disabled={isLoading}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
                        variant === 'destructive'
                          ? 'bg-[var(--color-error)] hover:bg-[var(--color-error-dark)]'
                          : 'bg-[var(--color-accent)] hover:bg-[var(--color-accent-dark)]'
                      )}
                    >
                      {isLoading && (
                        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                      )}
                      {confirmLabel ?? t('confirm')}
                    </motion.button>
                  </AlertDialogPrimitive.Action>
                </div>
              </motion.div>
            </AlertDialogPrimitive.Content>
          </AlertDialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </AlertDialogPrimitive.Root>
  );
}
