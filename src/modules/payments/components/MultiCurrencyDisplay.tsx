'use client';

/**
 * src/modules/payments/components/MultiCurrencyDisplay.tsx
 *
 * Renders a formatted monetary amount with optional live currency conversion.
 *
 * ✅ Zero "any" TypeScript — strict mode compatible
 * ✅ All colors via CSS variables (no hardcoded palette)
 * ✅ Framer Motion tooltip / swap animation
 * ✅ exactOptionalPropertyTypes: true compatible
 * ✅ Accessible: aria-label on the root span
 * ✅ Responsive: works inline in table cells, cards, and headings
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import type { Currency } from '../types/payment.types';

// ─── Static exchange-rate seed (UZS base) ────────────────────────────────────
// In production these would come from the API / tenant config.
// Using conservative mid-market rates for display purposes.

const UZS_RATES: Record<Exclude<Currency, 'UZS'>, number> = {
  USD: 12_750,
  EUR: 13_900,
  RUB: 142,
};

const LOCALE_MAP: Record<Currency, string> = {
  UZS: 'uz-UZ',
  USD: 'en-US',
  EUR: 'de-DE',
  RUB: 'ru-RU',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'UZS') {
    return `${new Intl.NumberFormat('uz-UZ').format(Math.round(amount))} so'm`;
  }
  return new Intl.NumberFormat(LOCALE_MAP[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Convert `amount` (in `from`) to `to` currency */
function convert(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  const toUZS =
    from === 'UZS' ? amount : amount * UZS_RATES[from as Exclude<Currency, 'UZS'>];
  if (to === 'UZS') return toUZS;
  return toUZS / UZS_RATES[to as Exclude<Currency, 'UZS'>];
}

/** Return a sensible secondary currency for quick conversion display */
function getSecondaryCurrency(primary: Currency): Currency {
  return primary === 'UZS' ? 'USD' : 'UZS';
}

// ─── Conversion tooltip ───────────────────────────────────────────────────────

interface ConversionTooltipProps {
  amount: number;
  currency: Currency;
}

function ConversionTooltip({ amount, currency }: ConversionTooltipProps) {
  const secondary = getSecondaryCurrency(currency);
  const converted = convert(amount, currency, secondary);

  return (
    <motion.div
      role="tooltip"
      initial={{ opacity: 0, y: 4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.95 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: 6,
        background: 'var(--text-primary)',
        color: 'var(--text-inverse)',
        borderRadius: 'var(--radius-md)',
        padding: '4px 10px',
        fontSize: 11,
        fontWeight: 500,
        whiteSpace: 'nowrap',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      ≈ {formatCurrency(converted, secondary)}
      {/* Caret */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '5px solid var(--text-primary)',
        }}
      />
    </motion.div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type MultiCurrencySize = 'sm' | 'md' | 'lg';

export interface MultiCurrencyDisplayProps {
  amount: number;
  currency: Currency;
  /**
   * When true, a ≈ secondary conversion line is shown below the primary.
   * Default: false — use the hover tooltip for compact displays.
   */
  showConversion?: boolean;
  /**
   * Visual size preset.
   * sm  — used in table cells / badges
   * md  — default; used in cards
   * lg  — used in headings / KPI displays
   */
  size?: MultiCurrencySize;
  className?: string;
  /** Override the conversion target currency */
  conversionCurrency?: Currency;
}

// ─── Size maps ────────────────────────────────────────────────────────────────

const primarySizeClass: Record<MultiCurrencySize, string> = {
  sm: 'text-sm font-semibold',
  md: 'text-base font-semibold',
  lg: 'text-2xl font-bold',
};

const secondarySizeClass: Record<MultiCurrencySize, string> = {
  sm: 'text-[10px]',
  md: 'text-xs',
  lg: 'text-sm',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function MultiCurrencyDisplay({
  amount,
  currency,
  showConversion = false,
  size = 'md',
  className,
  conversionCurrency,
}: MultiCurrencyDisplayProps) {
  const [hovered, setHovered] = useState(false);

  const primaryFormatted = formatCurrency(amount, currency);

  const secondary = conversionCurrency ?? getSecondaryCurrency(currency);
  const convertedAmount = convert(amount, currency, secondary);
  const secondaryFormatted = formatCurrency(convertedAmount, secondary);

  return (
    <span
      className={cn('relative inline-flex flex-col', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      aria-label={`${primaryFormatted}${showConversion ? `, approximately ${secondaryFormatted}` : ''}`}
    >
      {/* Hover tooltip (compact mode only) */}
      {!showConversion && (
        <AnimatePresence>
          {hovered && (
            <ConversionTooltip amount={amount} currency={currency} />
          )}
        </AnimatePresence>
      )}

      {/* Primary amount */}
      <span
        className={cn(
          'tabular-nums',
          primarySizeClass[size],
          'text-[var(--text-primary)]',
        )}
      >
        {primaryFormatted}
      </span>

      {/* Inline secondary (expanded mode) */}
      {showConversion && (
        <span
          className={cn(
            'tabular-nums flex items-center gap-0.5',
            secondarySizeClass[size],
            'text-[var(--text-muted)]',
          )}
          aria-hidden="true"
        >
          <RefreshCw
            size={size === 'lg' ? 10 : 8}
            className="shrink-0 opacity-60"
            aria-hidden="true"
          />
          ≈ {secondaryFormatted}
        </span>
      )}
    </span>
  );
}

// ─── MultiCurrencyTag ─────────────────────────────────────────────────────────
// Compact badge variant for use inside filter chips / table headers

interface MultiCurrencyTagProps {
  currency: Currency;
}

const CURRENCY_COLORS: Record<Currency, { bg: string; text: string }> = {
  UZS: { bg: 'var(--info-bg)', text: 'var(--info-text)' },
  USD: { bg: 'var(--success-bg)', text: 'var(--success-text)' },
  EUR: { bg: 'var(--warning-bg)', text: 'var(--warning-text)' },
  RUB: { bg: 'var(--error-bg)', text: 'var(--error-text)' },
};

export function MultiCurrencyTag({ currency }: MultiCurrencyTagProps) {
  const colors = CURRENCY_COLORS[currency];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 6px',
        borderRadius: 'var(--radius-full)',
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.05em',
        background: colors.bg,
        color: colors.text,
      }}
    >
      {currency}
    </span>
  );
}
