'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useEffect } from 'react';
import { useUIStore } from '@/store/ui.store';

interface ThemeProviderProps {
  children: React.ReactNode;
}

function ThemeSync(): null {
  const { theme } = useTheme();
  const setTheme = useUIStore((s) => s.setTheme);

  useEffect(() => {
    if (theme === 'light' || theme === 'dark' || theme === 'system') {
      setTheme(theme);
    }
  }, [theme, setTheme]);

  return null;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const storedTheme = useUIStore((s) => s.theme);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={storedTheme}
      enableSystem
      disableTransitionOnChange={false}
      storageKey="educrm-theme"
    >
      <ThemeSync />
      {children}
    </NextThemesProvider>
  );
}
