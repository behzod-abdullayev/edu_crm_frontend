'use client';

/**
 * src/shared/components/navigation/ThemeToggle.tsx
 *
 * FIX: Replaced wrong CSS variable names:
 *   --color-text-secondary → --text-secondary
 *   --color-ring           → --border-focus
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/shared/utils/cn';

type ThemeMode = 'light' | 'dark' | 'system';

const THEMES: { mode: ThemeMode; icon: React.ElementType; labelKey: string }[] = [
  { mode: 'light', icon: Sun, labelKey: 'light' },
  { mode: 'dark', icon: Moon, labelKey: 'dark' },
  { mode: 'system', icon: Monitor, labelKey: 'system' },
];

export function ThemeToggle() {
  const t = useTranslations('theme');
  const { theme, setTheme } = useTheme();
  const setStoreTheme = useUIStore((s: { setTheme: (t: ThemeMode) => void }) => s.setTheme);

  const current = (theme as ThemeMode) ?? 'system';
  const currentIdx = THEMES.findIndex((th) => th.mode === current);
  const next = THEMES[(currentIdx + 1) % THEMES.length];
  const CurrentIcon = THEMES[currentIdx]?.icon ?? Monitor;

  const handleToggle = () => {
    if (!next) return;
    setTheme(next.mode);
    setStoreTheme(next.mode);
  };

  return (
    <motion.button
      onClick={handleToggle}
      aria-label={t('switchTo', { mode: next ? t(next.labelKey) : '' })}
      whileTap={{ scale: 0.9 }}
      className={cn(
        'relative p-2 rounded-lg',
        'text-[var(--text-secondary)]',
        'hover:bg-[var(--bg-surface-hover)] transition-colors',
        'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
      )}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={current}
          initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
          transition={{ duration: 0.25 }}
        >
          <CurrentIcon size={18} aria-hidden="true" />
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
