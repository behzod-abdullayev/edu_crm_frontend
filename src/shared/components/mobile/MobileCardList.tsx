'use client';

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { PullToRefresh } from './PullToRefresh';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BulkAction<T> {
  label: string;
  icon?: React.ElementType;
  onClick: (items: T[]) => void;
  variant?: 'default' | 'danger';
}

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ElementType;
}

interface MobileCardListProps<T extends { id: string }> {
  data: T[];
  renderCard: (item: T, isSelected: boolean) => ReactNode;
  isLoading: boolean;
  error?: Error | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onRefresh?: () => Promise<void>;
  emptyState?: EmptyStateProps;
  onSelect?: (ids: string[]) => void;
  bulkActions?: BulkAction<T>[];
  className?: string;
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      aria-hidden="true"
      style={{
        padding: 16,
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div
          className="skeleton"
          style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0 }}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="skeleton" style={{ height: 14, borderRadius: 4, width: '60%' }} />
          <div className="skeleton" style={{ height: 12, borderRadius: 4, width: '40%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 12, borderRadius: 4, width: '80%' }} />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ title, description, action, icon: Icon }: EmptyStateProps) {
  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        gap: 12,
        textAlign: 'center',
      }}
    >
      {Icon && (
        <Icon
          size={48}
          color="var(--text-muted)"
          aria-hidden="true"
        />
      )}
      <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
        {title}
      </p>
      {description && (
        <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: 8,
            padding: '10px 20px',
            minHeight: 44,
            background: 'var(--brand-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '48px 24px',
        gap: 12,
        textAlign: 'center',
      }}
    >
      <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--color-error-solid)' }}>
        Something went wrong
      </p>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
        {error.message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: 8,
            padding: '10px 20px',
            minHeight: 44,
            background: 'var(--brand-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ─── Bulk Actions Bar ─────────────────────────────────────────────────────────

interface BulkActionsBarProps<T extends { id: string }> {
  selectedCount: number;
  actions: BulkAction<T>[];
  selectedItems: T[];
  onClear: () => void;
}

function BulkActionsBar<T extends { id: string }>({
  selectedCount,
  actions,
  selectedItems,
  onClear,
}: BulkActionsBarProps<T>) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 40 }}
      style={{
        position: 'fixed',
        bottom: 'calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom))',
        left: 0,
        right: 0,
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-default)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 40,
        boxShadow: '0 -2px 16px rgba(0,0,0,0.1)',
      }}
      role="toolbar"
      aria-label={`${selectedCount} item${selectedCount !== 1 ? 's' : ''} selected`}
    >
      <button
        onClick={onClear}
        style={{
          minHeight: 44,
          padding: '0 12px',
          background: 'none',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md, 8px)',
          fontSize: 14,
          color: 'var(--text-primary)',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        ✕ {selectedCount}
      </button>

      <div style={{ flex: 1, display: 'flex', gap: 8, overflowX: 'auto' }}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => action.onClick(selectedItems)}
              style={{
                minHeight: 44,
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background:
                  action.variant === 'danger'
                    ? 'var(--color-error-solid, #ef4444)'
                    : 'var(--brand-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md, 8px)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {Icon && <Icon size={16} aria-hidden="true" />}
              {action.label}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MobileCardList<T extends { id: string }>({
  data,
  renderCard,
  isLoading,
  error,
  hasMore,
  onLoadMore,
  onRefresh,
  emptyState,
  onSelect,
  bulkActions = [],
  className,
}: MobileCardListProps<T>) {
  const shouldReduceMotion = useReducedMotion();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Notify parent of selection changes
  useEffect(() => {
    onSelect?.(Array.from(selectedIds));
  }, [selectedIds, onSelect]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, hasMore]);

  const handleLongPressStart = useCallback(
    (item: T) => {
      if (bulkActions.length === 0) return;
      longPressTimerRef.current = setTimeout(() => {
        navigator.vibrate?.(50);
        setSelectionMode(true);
        setSelectedIds(new Set([item.id]));
      }, 400);
    },
    [bulkActions.length]
  );

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (next.size === 0) setSelectionMode(false);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const selectedItems = data.filter((item) => selectedIds.has(item.id));

  // ── Loading ──
  if (isLoading && data.length === 0) {
    return (
      <div className={className} aria-busy="true" aria-label="Loading…">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // ── Error ──
  if (error && data.length === 0) {
    return (
      <div className={className}>
        <ErrorState error={error} />
      </div>
    );
  }

  // ── Empty ──
  if (!isLoading && data.length === 0 && emptyState) {
    return (
      <div className={className}>
        <EmptyState {...emptyState} />
      </div>
    );
  }

  const list = (
    <div className={className}>
      {data.map((item) => {
        const isSelected = selectedIds.has(item.id);
        return (
          <div
            key={item.id}
            onPointerDown={() => handleLongPressStart(item)}
            onPointerUp={handleLongPressEnd}
            onPointerLeave={handleLongPressEnd}
            onClick={() => { if (selectionMode) toggleSelection(item.id); }}
            style={{ position: 'relative', userSelect: 'none' }}
          >
            {/* Selection overlay */}
            {selectionMode && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: `2px solid ${isSelected ? 'var(--brand-primary)' : 'var(--border-strong)'}`,
                  background: isSelected ? 'var(--brand-primary)' : 'transparent',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: shouldReduceMotion ? 'none' : 'all 0.15s',
                }}
              >
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l4 4 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            )}
            {renderCard(item, isSelected)}
          </div>
        );
      })}

      {/* Infinite scroll sentinel */}
      {hasMore && onLoadMore && (
        <div ref={loadMoreRef} style={{ height: 1 }} aria-hidden="true" />
      )}

      {/* Load more button fallback */}
      {hasMore && !onLoadMore && (
        <div style={{ padding: 16, textAlign: 'center' }}>
          <button
            onClick={onLoadMore}
            style={{
              minHeight: 44,
              padding: '0 24px',
              background: 'var(--brand-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Load more
          </button>
        </div>
      )}

      {isLoading && data.length > 0 && (
        <div style={{ padding: 16 }}>
          <SkeletonCard />
        </div>
      )}
    </div>
  );

  return (
    <>
      {onRefresh ? (
        <PullToRefresh onRefresh={onRefresh}>{list}</PullToRefresh>
      ) : (
        list
      )}

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selectionMode && bulkActions.length > 0 && (
          <BulkActionsBar
            selectedCount={selectedIds.size}
            actions={bulkActions}
            selectedItems={selectedItems}
            onClear={clearSelection}
          />
        )}
      </AnimatePresence>
    </>
  );
}
