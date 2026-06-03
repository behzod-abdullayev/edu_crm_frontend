import { useRef, useEffect } from 'react';

export function useClickOutside<T extends HTMLElement>(
  callback: () => void,
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePointerDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [callback]);

  return ref;
}
