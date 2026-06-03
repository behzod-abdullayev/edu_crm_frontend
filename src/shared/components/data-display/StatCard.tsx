'use client';

import { motion } from 'framer-motion';
import { SkeletonLoader } from '@shared/components/feedback/SkeletonLoader';
import { cn } from '@shared/utils/cn';
import type { LucideIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatCardProps {
  /** Card heading — shown above the value */
  title: string;
  /** Numeric or text value to display prominently */
  value: string | number;
  /** Optional descriptive line below the value */
  description?: string;
  /** Lucide icon rendered in the icon area */
  icon?: LucideIcon;
  /**
   * Hex color (e.g. "#6366f1") used for the icon and its backdrop.
   * If omitted, falls back to `var(--brand-primary)`.
   */
  iconColor?: string;
  /** When true, renders the `SkeletonLoader card` variant instead of content */
  isLoading?: boolean;
  /** Extra Tailwind classes forwarded to the card wrapper */
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
  isLoading,
  className,
}: StatCardProps) {
  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading === true) {
    return (
      <SkeletonLoader
        variant="card"
        {...(className !== undefined ? { className } : {})}
      />
    );
  }

  // ── Resolved colors ────────────────────────────────────────────────────────
  const resolvedColor   = iconColor ?? 'var(--brand-primary)';
  const resolvedBgColor = iconColor
    ? `${iconColor}18`              // 10 % alpha of the hex colour
    : 'color-mix(in srgb, var(--brand-primary) 10%, transparent)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: 'var(--shadow-lg)' }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        // Base card styles using design-system CSS variables
        'bg-[var(--bg-surface)] border border-[var(--border-default)]',
        'rounded-[var(--radius-xl)] p-5',
        'flex items-center gap-4',
        'cursor-default select-none',
        'transition-shadow duration-200',
        className,
      )}
      // Accessibility: the whole card is decorative; individual text conveys meaning
    >
      {/* ── Icon badge ── */}
      {Icon !== undefined && (
        <div
          aria-hidden="true"
          className="w-10 h-10 rounded-[var(--radius-lg)] flex items-center justify-center shrink-0"
          style={{ backgroundColor: resolvedBgColor }}
        >
          <Icon
            size={18}
            aria-hidden="true"
            style={{ color: resolvedColor }}
          />
        </div>
      )}

      {/* ── Text content ── */}
      <div className="min-w-0 flex-1">
        {/* Title */}
        <p
          className={cn(
            'text-xs font-medium uppercase tracking-wide truncate',
            'text-[var(--text-muted)]',
          )}
        >
          {title}
        </p>

        {/* Value */}
        <p
          className={cn(
            'text-2xl font-bold tabular-nums truncate',
            'text-[var(--text-primary)]',
          )}
          aria-label={`${title}: ${value}`}
        >
          {value}
        </p>

        {/* Optional description */}
        {description !== undefined && (
          <p
            className={cn(
              'text-xs mt-0.5 truncate',
              'text-[var(--text-muted)]',
            )}
          >
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
}