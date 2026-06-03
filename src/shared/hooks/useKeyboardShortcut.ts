import { useEffect, useCallback } from 'react';

interface KeyboardShortcutOptions {
  preventDefault?: boolean;
  enabled?: boolean;
}

export function useKeyboardShortcut(
  keys: string[],
  callback: () => void,
  options: KeyboardShortcutOptions = {},
): void {
  const { preventDefault = true, enabled = true } = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const pressedKeys = new Set<string>();

      if (e.metaKey) pressedKeys.add('meta');
      if (e.ctrlKey) pressedKeys.add('ctrl');
      if (e.shiftKey) pressedKeys.add('shift');
      if (e.altKey) pressedKeys.add('alt');
      pressedKeys.add(e.key.toLowerCase());

      const requiredKeys = keys.map((k) => k.toLowerCase());
      const allMatch = requiredKeys.every((k) => pressedKeys.has(k));

      if (allMatch) {
        if (preventDefault) e.preventDefault();
        callback();
      }
    },
    [keys, callback, preventDefault, enabled],
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
