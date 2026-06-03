import { useState, useEffect } from 'react';

interface UseVirtualKeyboardReturn {
  isKeyboardVisible: boolean;
  keyboardHeight: number;
}

export function useVirtualKeyboard(): UseVirtualKeyboardReturn {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.visualViewport) return;

    const viewport = window.visualViewport;

    const handleResize = () => {
      const windowHeight = window.innerHeight;
      const viewportHeight = viewport.height;
      const diff = windowHeight - viewportHeight;

      // Threshold of 150px to account for browser chrome changes
      if (diff > 150) {
        setIsKeyboardVisible(true);
        setKeyboardHeight(diff);
      } else {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    };

    viewport.addEventListener('resize', handleResize);
    return () => {
      viewport.removeEventListener('resize', handleResize);
    };
  }, []);

  return { isKeyboardVisible, keyboardHeight };
}
