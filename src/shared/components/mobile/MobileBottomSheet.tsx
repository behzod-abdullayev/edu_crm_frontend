'use client';

import {
  useEffect,
  useRef,
  useId,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type PanInfo,
} from 'framer-motion';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  description?: string;
  snapPoints?: number[];
  defaultSnap?: number;
  showHandle?: boolean;
  closeOnBackdrop?: boolean;
  maxHeight?: string;
  className?: string;
}

// ─── Focus trap helpers ───────────────────────────────────────────────────────

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MobileBottomSheet({
  open,
  onClose,
  children,
  title,
  description,
  snapPoints = [0.5, 0.92],
  defaultSnap,
  showHandle = true,
  closeOnBackdrop = true,
  maxHeight = '92vh',
  className,
}: MobileBottomSheetProps) {
  const shouldReduceMotion = useReducedMotion();
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  const snapIndex = defaultSnap ?? snapPoints.length - 1;
  const snapHeight = `${(snapPoints[snapIndex] ?? 0.92) * 100}vh`;

  // Body scroll lock
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Focus first element on open
  useEffect(() => {
    if (open && sheetRef.current) {
      const timer = setTimeout(() => {
        const focusable = getFocusable(sheetRef.current!);
        focusable[0]?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open || !sheetRef.current) return;
    const el = sheetRef.current;

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable(el);
      if (!focusable.length) { e.preventDefault(); return; }
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    el.addEventListener('keydown', trap);
    return () => el.removeEventListener('keydown', trap);
  }, [open]);

  // Drag dismiss handler
  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const sheetHeight = sheetRef.current?.offsetHeight ?? window.innerHeight * 0.92;
    const velocityThreshold = 500;
    const distanceThreshold = sheetHeight * 0.3;

    if (
      info.velocity.y >= velocityThreshold ||
      info.offset.y > distanceThreshold
    ) {
      onClose();
    }
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            aria-hidden="true"
            onClick={closeOnBackdrop ? onClose : undefined}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'var(--bg-overlay, rgba(0,0,0,0.5))',
              zIndex: 60,
            }}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 400, damping: 40 }
            }
            className={className}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight,
              minHeight: snapHeight,
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-2xl, 20px) var(--radius-2xl, 20px) 0 0',
              boxShadow: '0 -4px 32px rgba(0,0,0,0.15)',
              zIndex: 61,
              display: 'flex',
              flexDirection: 'column',
              paddingBottom: 'env(safe-area-inset-bottom)',
              outline: 'none',
            }}
          >
            {/* Drag handle */}
            {showHandle && (
              <div
                aria-hidden="true"
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  paddingTop: 12,
                  paddingBottom: 8,
                  flexShrink: 0,
                  cursor: 'grab',
                  touchAction: 'none',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 4,
                    borderRadius: 999,
                    background: 'var(--border-strong, #ccc)',
                  }}
                />
              </div>
            )}

            {/* Header */}
            {(title || description) && (
              <div style={{ paddingInline: 20, paddingBottom: 12, flexShrink: 0 }}>
                {title && (
                  <h2
                    id={titleId}
                    style={{
                      margin: 0,
                      fontSize: 17,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                    }}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id={descId}
                    style={{
                      margin: '4px 0 0',
                      fontSize: 14,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Scrollable content */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
