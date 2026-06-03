import { useRef, useState, useCallback, useEffect } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  threshold?: number;
}

interface UsePullToRefreshReturn {
  ref: React.RefObject<HTMLDivElement | null>;
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
}

export function usePullToRefresh({
  onRefresh,
  disabled = false,
  threshold = 80,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const ref = useRef<HTMLDivElement | null>(null);
  const startY = useRef<number>(0);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing) return;
      const el = ref.current;
      if (!el) return;
      // Only activate at the top of the scroll container
      if (el.scrollTop > 0) return;
      const touch = e.touches[0];
      if (touch) startY.current = touch.clientY;
    },
    [disabled, isRefreshing],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (disabled || isRefreshing || startY.current === 0) return;
      const touch = e.touches[0];
      if (!touch) return;
      const delta = touch.clientY - startY.current;
      if (delta <= 0) return;

      setIsPulling(true);
      // Apply resistance: slow down past threshold
      const distance = delta < threshold ? delta : threshold + (delta - threshold) * 0.3;
      setPullDistance(Math.min(distance, threshold * 1.5));
    },
    [disabled, isRefreshing, threshold],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setIsPulling(false);
    setPullDistance(0);
    startY.current = 0;
  }, [isPulling, pullDistance, threshold, onRefresh]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { ref, isPulling, isRefreshing, pullDistance };
}
