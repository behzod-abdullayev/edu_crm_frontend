'use client';

/**
 * src/shared/components/navigation/LanguageSwitcher.tsx
 *
 * FIX: Replaced all wrong CSS variable names:
 *   --color-text-secondary  → --text-secondary
 *   --color-ring            → --border-focus
 *   --color-border          → --border-default
 *   --color-accent          → --brand-primary
 *   --color-accent-subtle   → (inline opacity or --info-bg)
 *
 * FIX: Use next/navigation's useRouter for locale-aware routing.
 *      The path replacement approach is correct; ensured it handles
 *      both `/uz/owner/...` and root paths properly.
 */

import { motion } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface LocaleOption {
  code: string;
  label: string;
  flag: string;
}

const LOCALES: LocaleOption[] = [
  { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];

export function LanguageSwitcher() {
  const t = useTranslations('language');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const currentLocale = (LOCALES.find((l) => l.code === locale) ?? LOCALES[0]) as LocaleOption;

  const handleChange = (code: string) => {
    if (code === locale) return;
    // Pathname format: /uz/owner/dashboard → replace first segment
    const segments = pathname.split('/');
    // segments[0] is '' (empty before first slash), segments[1] is locale
    if (segments.length >= 2) {
      segments[1] = code;
    }
    router.push(segments.join('/'));
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={t('switchLanguage')}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm',
            'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]',
            'transition-colors outline-none',
            'focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
          )}
        >
          <span aria-hidden="true">{currentLocale.flag}</span>
          <span className="hidden sm:inline font-medium">
            {currentLocale.code.toUpperCase()}
          </span>
          <ChevronDown size={12} aria-hidden="true" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content asChild sideOffset={6} align="end">
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'z-50 min-w-40',
              'bg-[var(--bg-surface)] border border-[var(--border-default)]',
              'rounded-xl shadow-[var(--shadow-xl)] overflow-hidden outline-none p-1',
            )}
          >
            {LOCALES.map((loc) => {
              const isSelected = locale === loc.code;
              return (
                <DropdownMenu.Item key={loc.code} asChild>
                  <button
                    onClick={() => handleChange(loc.code)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg',
                      'transition-colors cursor-pointer outline-none',
                      'focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                      isSelected
                        ? 'text-[var(--brand-primary)] bg-[var(--info-bg)] font-semibold'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
                    )}
                  >
                    <span aria-hidden="true">{loc.flag}</span>
                    <span className="flex-1 text-left">{loc.label}</span>
                    {isSelected && (
                      <Check
                        size={13}
                        className="text-[var(--brand-primary)]"
                        aria-label="selected"
                      />
                    )}
                  </button>
                </DropdownMenu.Item>
              );
            })}
          </motion.div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
