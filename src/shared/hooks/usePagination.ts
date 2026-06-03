import { useState, useCallback, useMemo } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  total?: number;
}

interface UsePaginationReturn {
  page: number;
  limit: number;
  totalPages: number;
  canGoNext: boolean;
  canGoPrev: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
}

export function usePagination({
  initialPage = 1,
  initialLimit = 20,
  total = 0,
}: UsePaginationOptions = {}): UsePaginationReturn {
  const [page, setPageState] = useState(initialPage);
  const [limit, setLimitState] = useState(initialLimit);

  const totalPages = useMemo(
    () => (total > 0 ? Math.ceil(total / limit) : 1),
    [total, limit],
  );

  const canGoNext = page < totalPages;
  const canGoPrev = page > 1;

  const setPage = useCallback(
    (newPage: number) => {
      setPageState(Math.max(1, Math.min(newPage, totalPages)));
    },
    [totalPages],
  );

  const setLimit = useCallback((newLimit: number) => {
    setLimitState(newLimit);
    setPageState(1);
  }, []);

  const nextPage = useCallback(() => {
    if (canGoNext) setPageState((p) => p + 1);
  }, [canGoNext]);

  const prevPage = useCallback(() => {
    if (canGoPrev) setPageState((p) => p - 1);
  }, [canGoPrev]);

  const goToPage = useCallback(
    (target: number) => {
      setPage(target);
    },
    [setPage],
  );

  return {
    page,
    limit,
    totalPages,
    canGoNext,
    canGoPrev,
    setPage,
    setLimit,
    nextPage,
    prevPage,
    goToPage,
  };
}
