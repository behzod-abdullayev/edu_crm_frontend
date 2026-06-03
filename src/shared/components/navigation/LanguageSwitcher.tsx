'use client';

import { motion } from 'framer-motion';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@shared/utils/cn';

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
    // Replace locale segment in path and reload
    const segments = pathname.split('/');
    segments[1] = code;
    router.push(segments.join('/'));
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label={t('switchLanguage')}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--bg-sidebar-item-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        >
          <span aria-hidden="true">{currentLocale.flag}</span>
          <span className="hidden sm:inline font-medium">{currentLocale.code.toUpperCase()}</span>
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
            className="z-50 min-w-40 bg-[var(--bg-surface)] border border-[var(--color-border)] rounded-xl shadow-xl overflow-hidden outline-none p-1"
          >
            {LOCALES.map((loc) => (
              <DropdownMenu.Item key={loc.code} asChild>
                <button
                  onClick={() => handleChange(loc.code)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
                    locale === loc.code
                      ? 'text-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                      : 'text-[var(--color-text-primary)] hover:bg-[var(--bg-sidebar-item-hover)]'
                  )}
                >
                  <span aria-hidden="true">{loc.flag}</span>
                  <span className="flex-1 text-left">{loc.label}</span>
                  {locale === loc.code && (
                    <Check size={13} className="text-[var(--color-accent)]" aria-label="selected" />
                  )}
                </button>
              </DropdownMenu.Item>
            ))}
          </motion.div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
