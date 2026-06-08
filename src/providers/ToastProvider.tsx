'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUIStore, type Toast } from '@/store/ui.store';
import { useIsMobile } from '@/shared/hooks/useIsMobile';

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  // Auto-dismiss: success/info=4s, warning=6s, error=6s (was 0 = never)
  useEffect(() => {
    const duration =
      toast.duration !== undefined
        ? toast.duration
        : toast.type === 'warning'
          ? 6000
          : toast.type === 'error'
            ? 6000
            : 4000;

    if (duration <= 0) return;

    const timer = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const changedTouch = e.changedTouches[0];
    if (!changedTouch) return;
    const deltaX = changedTouch.clientX - touchStartX.current;
    const deltaY = Math.abs(changedTouch.clientY - touchStartY.current);
    if (Math.abs(deltaX) > 60 && deltaY < 30) {
      onDismiss(toast.id);
    }
  };

  const iconMap: Record<Toast['type'], string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const colorMap: Record<Toast['type'], string> = {
    success: 'var(--toast-success, #16a34a)',
    error: 'var(--toast-error, #dc2626)',
    warning: 'var(--toast-warning, #d97706)',
    info: 'var(--toast-info, #2563eb)',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 16px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: '10px',
        boxShadow: 'var(--shadow-lg)',
        cursor: 'default',
        userSelect: 'none',
        minWidth: '280px',
        maxWidth: '400px',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="alert"
      aria-live="polite"
    >
      <span
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          background: colorMap[toast.type],
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 700,
          flexShrink: 0,
          marginTop: '1px',
        }}
      >
        {iconMap[toast.type]}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, lineHeight: 1.4, color: 'var(--text-primary)' }}>
          {toast.title}
        </p>
        {toast.description && (
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            style={{
              marginTop: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: colorMap[toast.type],
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          color: 'var(--text-secondary)',
          fontSize: '18px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </motion.div>
  );
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);
  const isMobile = useIsMobile();

  const containerStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'center',
        pointerEvents: 'none',
      }
    : {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      };

  return (
    <>
      {children}
      <div style={containerStyle}>
        <AnimatePresence mode="sync">
          {toasts.slice(-3).map((toast) => (
            <div key={toast.id} style={{ pointerEvents: 'auto' }}>
              <ToastItem toast={toast} onDismiss={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}