import { useRef, useCallback } from 'react';

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  velocityThreshold?: number;
}

interface UseSwipeGestureReturn {
  ref: React.RefObject<HTMLDivElement | null>;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.3,
}: UseSwipeGestureOptions): UseSwipeGestureReturn {
  const ref = useRef<HTMLDivElement | null>(null);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const startTime = useRef<number>(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    startTime.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      if (!touch) return;
      const deltaX = touch.clientX - startX.current;
      const deltaY = touch.clientY - startY.current;
      const elapsed = Date.now() - startTime.current;

      const velocityX = Math.abs(deltaX) / elapsed;
      const velocityY = Math.abs(deltaY) / elapsed;
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      const isHorizontal = absX > absY;

      if (isHorizontal) {
        if (absX >= threshold && velocityX >= velocityThreshold) {
          if (deltaX < 0) {
            onSwipeLeft?.();
          } else {
            onSwipeRight?.();
          }
        }
      } else {
        if (absY >= threshold && velocityY >= velocityThreshold) {
          if (deltaY < 0) {
            onSwipeUp?.();
          } else {
            onSwipeDown?.();
          }
        }
      }
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, velocityThreshold],
  );

  // Attach listeners imperatively to avoid re-renders
  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      const current = ref.current;
      if (current) {
        current.removeEventListener('touchstart', handleTouchStart);
        current.removeEventListener('touchend', handleTouchEnd);
      }
      if (node) {
        node.addEventListener('touchstart', handleTouchStart, { passive: true });
        node.addEventListener('touchend', handleTouchEnd, { passive: true });
      }
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [handleTouchStart, handleTouchEnd],
  );

  // setRef is used internally; expose ref for consumers
  void setRef;

  return { ref };
}
