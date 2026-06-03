'use client';

import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export function MobileDrawer({ open, onClose, children, title }: MobileDrawerProps) {
  const t = useTranslations('common');

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={title ?? t('drawer')}
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0, right: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60 || info.velocity.x < -300) onClose();
            }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-[var(--bg-surface)] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-4 border-b border-[var(--color-border)] shrink-0">
              {title && (
                <h2 className="font-semibold text-[var(--color-text-primary)] text-base">{title}</h2>
              )}
              <button
                onClick={onClose}
                aria-label={t('close')}
                className="ml-auto p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--bg-sidebar-item-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
