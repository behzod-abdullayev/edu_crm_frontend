'use client';

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  disabled?: boolean;
}

type RefreshState = 'idle' | 'pulling' | 'ready' | 'refreshing';

// ─── usePullToRefresh hook ────────────────────────────────────────────────────

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

interface UsePullToRefreshReturn {
  pullDistance: number;
  refreshState: RefreshState;
  containerRef: React.RefObject<HTMLDivElement | null>;
  isDragging: boolean;
}

function usePullToRefresh({
  onRefresh,
  threshold = 80,
  disabled = false,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshState, setRefreshState] = useState<RefreshState>('idle');
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled) return;
      const el = containerRef.current;
      if (!el || el.scrollTop > 0) return;
      const touch = e.touches[0];
      if (!touch) return;
      startYRef.current = touch.clientY;
      isDraggingRef.current = true;
      setIsDragging(true);
    },
    [disabled]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDraggingRef.current || startYRef.current === null) return;
      const el = containerRef.current;
      if (!el || el.scrollTop > 0) {
        isDraggingRef.current = false;
        setIsDragging(false);
        return;
      }
      const touch = e.touches[0];
      if (!touch) return;
      const currentY = touch.clientY;
      const dist = Math.max(0, currentY - startYRef.current);
      // Elastic resistance: sqrt(dist) * 4
      const resistance = Math.sqrt(dist) * 4;
      const clamped = Math.min(resistance, threshold * 1.5);
      setPullDistance(clamped);
      setRefreshState(resistance >= threshold ? 'ready' : 'pulling');

      if (dist > 5) {
        e.preventDefault();
      }
    },
    [threshold]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    startYRef.current = null;

    setRefreshState((current) => {
      if (current === 'ready') {
        // Trigger refresh asynchronously
        void (async () => {
          setRefreshState('refreshing');
          setPullDistance(threshold * 0.75);
          try {
            await onRefresh();
          } finally {
            setPullDistance(0);
            setRefreshState('idle');
          }
        })();
        return 'refreshing';
      }
      setPullDistance(0);
      return 'idle';
    });
  }, [threshold, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { pullDistance, refreshState, containerRef, isDragging };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const shouldReduceMotion = useReducedMotion();
  const { pullDistance, refreshState, containerRef, isDragging } =
    usePullToRefresh({ onRefresh, threshold, disabled });

  const isRefreshing = refreshState === 'refreshing';
  const isReady = refreshState === 'ready';
  const showIndicator = pullDistance > 0 || isRefreshing;

  const indicatorLabel = isRefreshing
    ? 'Refreshing…'
    : isReady
    ? 'Release to refresh'
    : 'Pull to refresh';

  const rotation = (pullDistance / threshold) * 180;

  const indicatorHeight = showIndicator
    ? Math.max(pullDistance, isRefreshing ? 60 : 0)
    : 0;

  // Use instant transitions while the user is dragging, spring when snapping
  const heightTransition = shouldReduceMotion
    ? { duration: 0 }
    : isDragging
    ? { type: 'tween' as const, duration: 0 }
    : { type: 'spring' as const, stiffness: 300, damping: 30 };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        height: '100%',
      }}
    >
      {/* Pull indicator */}
      <motion.div
        animate={{ height: indicatorHeight }}
        transition={heightTransition}
        style={{
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 4,
        }}
        aria-live="polite"
        aria-label={showIndicator ? indicatorLabel : undefined}
      >
        {showIndicator && (
          <>
            <motion.div
              animate={
                shouldReduceMotion
                  ? {}
                  : isRefreshing
                  ? { rotate: [0, 360] }
                  : { rotate: rotation }
              }
              transition={
                isRefreshing
                  ? { repeat: Infinity, duration: 0.8, ease: 'linear' }
                  : { type: 'tween', duration: 0 }
              }
            >
              <RefreshCw
                size={20}
                color={isReady ? 'var(--brand-primary)' : 'var(--text-muted)'}
                aria-hidden="true"
              />
            </motion.div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              {indicatorLabel}
            </motion.span>
          </>
        )}
      </motion.div>

      {children}
    </div>
  );
}
