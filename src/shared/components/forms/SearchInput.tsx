'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@shared/utils/cn';
import { useDebounce } from '@shared/hooks/useDebounce';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
  debounce?: number;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  isLoading = false,
  debounce = 300,
  className,
}: SearchInputProps) {
  const t = useTranslations('common');
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, debounce);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync debounced value to parent
  useEffect(() => {
    onChange(debouncedValue);
  }, [debouncedValue, onChange]);

  // Sync parent value to local (for controlled clear)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className={cn('relative', className)}>
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none"
        aria-hidden="true"
      />

      <input
        ref={inputRef}
        type="search"
        role="searchbox"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder ?? t('search')}
        className={cn(
          'w-full h-11 pl-9 pr-9 rounded-lg border border-[var(--color-border)] bg-[var(--bg-surface)]',
          'text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]',
          'hover:border-[var(--color-border-hover)]'
        )}
        aria-label={placeholder ?? t('search')}
      />

      {/* Right: loading spinner OR clear button */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.span
              key="spinner"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Loader2 size={14} className="animate-spin text-[var(--color-text-muted)]" aria-label={t('loading')} />
            </motion.span>
          ) : localValue ? (
            <motion.button
              key="clear"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={handleClear}
              type="button"
              aria-label={t('clear')}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] rounded"
            >
              <X size={14} aria-hidden="true" />
            </motion.button>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
