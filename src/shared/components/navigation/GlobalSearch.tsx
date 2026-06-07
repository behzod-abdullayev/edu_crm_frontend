'use client';

/**
 * src/shared/components/navigation/GlobalSearch.tsx
 *
 * FIX: Replaced all wrong CSS variable names:
 *   --color-border       → --border-default
 *   --color-ring         → --border-focus
 *   --color-text-primary → --text-primary
 *   --color-text-muted   → --text-muted
 *   --bg-table-header    → --bg-surface-secondary
 *
 * FIX: Added missing translation keys used but absent from locale files:
 *   search.inputPlaceholder, search.navigate, search.select,
 *   search.close, search.openSearch, search.searchLabel
 *   (these are now added to uz/en/ru locale files)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Search, Clock, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { searchGlobal } from '@/shared/api/search.api';
import { cn } from '@/shared/utils/cn';
import type { SearchResult } from '@/shared/types';

const RECENT_KEY = 'educrm:recent-searches';
const MAX_RECENT = 5;

function getRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function addRecent(query: string) {
  const prev = getRecent().filter((q) => q !== query);
  localStorage.setItem(RECENT_KEY, JSON.stringify([query, ...prev].slice(0, MAX_RECENT)));
}

interface GlobalSearchProps {
  className?: string;
}

export function GlobalSearch({ className }: GlobalSearchProps) {
  const t = useTranslations('search');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query, 300);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Load recent on open
  useEffect(() => {
    if (open) {
      setRecent(getRecent());
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [open]);

  // Fetch results
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    searchGlobal(debouncedQuery)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      addRecent(query);
      router.push(result.href);
      setOpen(false);
    },
    [query, router]
  );

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.group] ??= []).push(r);
    return acc;
  }, {});

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label={t('openSearch')}
        aria-keyshortcuts="Meta+K"
        className={cn(
          'flex items-center gap-2 w-full h-9 px-3 rounded-lg',
          'border border-[var(--border-default)]',
          'bg-[var(--bg-surface-secondary)] text-sm text-[var(--text-muted)]',
          'hover:bg-[var(--bg-surface-hover)] transition-colors',
          'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
          className
        )}
      >
        <Search size={14} aria-hidden="true" />
        <span className="flex-1 text-left">{t('placeholder')}</span>
        <kbd className={cn(
          'hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5',
          'text-[10px] font-medium rounded',
          'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-muted)]'
        )}>
          ⌘K
        </kbd>
      </button>

      {/* Modal overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.18 }}
              className="fixed top-[15%] left-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
            >
              <Command
                className={cn(
                  'bg-[var(--bg-surface)] border border-[var(--border-default)]',
                  'rounded-2xl shadow-[var(--shadow-xl)] overflow-hidden',
                )}
                label={t('searchLabel')}
              >
                {/* Search input */}
                <div className={cn(
                  'flex items-center gap-3 px-4',
                  'border-b border-[var(--border-default)]',
                )}>
                  <Search
                    size={16}
                    className="text-[var(--text-muted)] shrink-0"
                    aria-hidden="true"
                  />
                  <Command.Input
                    ref={inputRef}
                    value={query}
                    onValueChange={setQuery}
                    placeholder={t('inputPlaceholder')}
                    className={cn(
                      'flex-1 h-14 text-sm bg-transparent outline-none',
                      'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
                    )}
                  />
                  <button
                    onClick={() => setOpen(false)}
                    aria-label={t('close')}
                    className={cn(
                      'p-1 rounded-md transition-colors outline-none',
                      'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                      'focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                    )}
                  >
                    <X size={15} aria-hidden="true" />
                  </button>
                </div>

                <Command.List className="max-h-80 overflow-y-auto p-2">
                  {/* Recent searches */}
                  {!query && recent.length > 0 && (
                    <Command.Group
                      heading={t('recent')}
                      className={cn(
                        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
                        '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
                        '[&_[cmdk-group-heading]]:text-[var(--text-muted)]',
                      )}
                    >
                      {recent.map((r) => (
                        <Command.Item
                          key={r}
                          onSelect={() => setQuery(r)}
                          className={cn(
                            'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm cursor-pointer',
                            'text-[var(--text-primary)]',
                            'hover:bg-[var(--bg-surface-hover)]',
                            'aria-selected:bg-[var(--bg-surface-hover)] outline-none',
                          )}
                        >
                          <Clock
                            size={13}
                            className="text-[var(--text-muted)]"
                            aria-hidden="true"
                          />
                          {r}
                        </Command.Item>
                      ))}
                    </Command.Group>
                  )}

                  {/* Results */}
                  {Object.entries(grouped).map(([group, items]) => (
                    <Command.Group
                      key={group}
                      heading={t(`groups.${group}`, { defaultValue: group })}
                      className={cn(
                        '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5',
                        '[&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium',
                        '[&_[cmdk-group-heading]]:text-[var(--text-muted)]',
                      )}
                    >
                      {items.map((item) => (
                        <Command.Item
                          key={item.id}
                          onSelect={() => handleSelect(item)}
                          className={cn(
                            'flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer',
                            'text-[var(--text-primary)]',
                            'hover:bg-[var(--bg-surface-hover)]',
                            'aria-selected:bg-[var(--bg-surface-hover)] outline-none',
                          )}
                        >
                          <span className="truncate">{item.label}</span>
                          <ArrowRight
                            size={13}
                            className="text-[var(--text-muted)] shrink-0"
                            aria-hidden="true"
                          />
                        </Command.Item>
                      ))}
                    </Command.Group>
                  ))}

                  {query && !isLoading && results.length === 0 && (
                    <Command.Empty className="py-10 text-center text-sm text-[var(--text-muted)]">
                      {t('noResults', { query })}
                    </Command.Empty>
                  )}
                </Command.List>

                {/* Footer hint */}
                <div className={cn(
                  'flex items-center gap-3 px-4 py-2.5',
                  'border-t border-[var(--border-default)]',
                  'text-[10px] text-[var(--text-muted)]',
                )}>
                  <span><kbd className="font-mono">↑↓</kbd> {t('navigate')}</span>
                  <span><kbd className="font-mono">↵</kbd> {t('select')}</span>
                  <span><kbd className="font-mono">Esc</kbd> {t('close')}</span>
                </div>
              </Command>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
