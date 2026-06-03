'use client';

import { useState, useEffect } from 'react';

/**
 * Debounces a value by `delay` ms.
 * Returns the debounced value — updates fire only after the delay elapses
 * with no further changes.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
