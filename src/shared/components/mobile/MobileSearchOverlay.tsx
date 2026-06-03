'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Search, X, Clock, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  type: 'student' | 'course';
  title: string;
  subtitle?: string;
  href: string;
}

interface MobileSearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = 'educrm:recent-searches';
const MAX_RECENT = 5;

// ─── localStorage helpers ─────────────────────────────────────────────────────

function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string): void {
  try {
    const current = getRecentSearches().filter((s) => s !== query);
    const updated = [query, ...current].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be unavailable — silently ignore
  }
}

function removeRecentSearch(query: string): string[] {
  try {
    const updated = getRecentSearches().filter((s) => s !== query);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

// ─── Debounce hook ────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MobileSearchOverlay({ open, onClose }: MobileSearchOverlayProps) {
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debouncedQuery = useDebounce(query.trim(), 300);

  // Prevent SSR portal issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load recent searches and focus input when opening
  useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches());
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    } else {
      setQuery('');
    }
  }, [open]);

  // Body scroll lock
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Fetch search results
  const { data: results, isFetching } = useQuery<SearchResult[]>({
    queryKey: ['mobile-search', debouncedQuery],
    queryFn: async ({ signal }) => {
      if (!debouncedQuery) return [];
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=10`,
        { signal }
      );
      if (!res.ok) throw new Error('Search failed');
      return res.json() as Promise<SearchResult[]>;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  });

  const navigate = useCallback(
    (href: string, searchQuery?: string) => {
      if (searchQuery) saveRecentSearch(searchQuery);
      onClose();
      router.push(href);
    },
    [onClose, router]
  );

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && results?.[0]) {
      navigate(results[0].href, query.trim());
    }
  }

  function clearQuery() {
    setQuery('');
    inputRef.current?.focus();
  }

  function handleRemoveRecent(term: string) {
    setRecentSearches(removeRecentSearch(term));
  }

  const showRecent = !query && recentSearches.length > 0;
  const showResults = !!debouncedQuery && (results?.length ?? 0) > 0;
  const showEmpty =
    !!debouncedQuery && !isFetching && (results?.length ?? 0) === 0;

  // Do not render portal until mounted (avoids SSR hydration mismatch)
  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={
            shouldReduceMotion ? { duration: 0 } : { duration: 0.15, ease: 'easeOut' }
          }
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-surface)',
            zIndex: 70,
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 'env(safe-area-inset-top)',
          }}
          role="search"
          aria-label="Search"
        >
          {/* ── Header ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderBottom: '1px solid var(--border-default)',
              flexShrink: 0,
            }}
          >
            <button
              onClick={onClose}
              aria-label="Close search"
              style={{
                width: 44,
                height: 44,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                borderRadius: 'var(--radius-md)',
                flexShrink: 0,
              }}
            >
              <ArrowLeft size={24} aria-hidden="true" />
            </button>

            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--bg-surface-hover)',
                borderRadius: 'var(--radius-full)',
                paddingInline: 12,
                height: 44,
              }}
            >
              <Search size={18} color="var(--text-muted)" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                inputMode="search"
                placeholder="Search students, courses…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                aria-label="Search query"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'none',
                  outline: 'none',
                  fontSize: 16,
                  color: 'var(--text-primary)',
                }}
              />
              {query && (
                <button
                  onClick={clearQuery}
                  aria-label="Clear search"
                  style={{
                    width: 28,
                    height: 28,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    color: 'var(--bg-surface)',
                    flexShrink: 0,
                  }}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          {/* ── Content ── */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {/* Loading spinner */}
            {isFetching && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: 32,
                }}
                aria-live="polite"
                aria-label="Searching…"
              >
                <Loader2
                  size={24}
                  color="var(--brand-primary)"
                  style={{ animation: 'spin 1s linear infinite' }}
                  aria-hidden="true"
                />
              </div>
            )}

            {/* Recent searches */}
            {showRecent && !isFetching && (
              <section aria-label="Recent searches">
                <p
                  style={{
                    margin: 0,
                    padding: '16px 16px 8px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Recent
                </p>
                {recentSearches.map((term) => (
                  <div
                    key={term}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      paddingInline: 16,
                    }}
                  >
                    <button
                      onClick={() => setQuery(term)}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 12,
                        minHeight: 48,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: 'var(--text-primary)',
                        fontSize: 16,
                      }}
                    >
                      <Clock size={18} color="var(--text-muted)" aria-hidden="true" />
                      {term}
                    </button>
                    <button
                      onClick={() => handleRemoveRecent(term)}
                      aria-label={`Remove "${term}" from recent searches`}
                      style={{
                        width: 44,
                        height: 44,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </section>
            )}

            {/* Search results */}
            {showResults && !isFetching && (
              <ul
                role="listbox"
                aria-label="Search results"
                style={{ margin: 0, padding: 0, listStyle: 'none' }}
              >
                {results!.map((result) => (
                  <li key={result.id} role="option" aria-selected={false}>
                    <button
                      onClick={() => navigate(result.href, query.trim())}
                      style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        padding: '12px 16px',
                        minHeight: 48,
                        background: 'none',
                        border: 'none',
                        borderBottom: '1px solid var(--border-default)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 16,
                          color: 'var(--text-primary)',
                          fontWeight: 500,
                        }}
                      >
                        {result.title}
                      </span>
                      {result.subtitle && (
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {result.subtitle}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Empty state */}
            {showEmpty && (
              <div
                aria-live="polite"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 48,
                  gap: 12,
                  color: 'var(--text-muted)',
                }}
              >
                <Search size={40} aria-hidden="true" />
                <p style={{ margin: 0, fontSize: 16, textAlign: 'center' }}>
                  No results for &ldquo;{debouncedQuery}&rdquo;
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
