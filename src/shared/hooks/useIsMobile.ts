'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 640;

/**
 * Returns true when viewport width is below the sm (640px) breakpoint.
 * Uses matchMedia + resize observer for SSR-safe hydration.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    setIsMobile(mq.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  return isMobile;
}
