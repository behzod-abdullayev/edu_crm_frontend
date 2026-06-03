import { useRef, useEffect, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  fetchMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
}

interface UseInfiniteScrollReturn {
  ref: React.RefObject<HTMLDivElement | null>;
}

export function useInfiniteScroll({
  fetchMore,
  hasMore,
  isLoading,
  threshold = 0.1,
}: UseInfiniteScrollOptions): UseInfiniteScrollReturn {
  const ref = useRef<HTMLDivElement | null>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry !== undefined && entry.isIntersecting && hasMore && !isLoading) {
        fetchMore();
      }
    },
    [fetchMore, hasMore, isLoading],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
    });
    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection, threshold]);

  return { ref };
}
