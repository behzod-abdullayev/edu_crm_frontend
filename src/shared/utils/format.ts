import { format as formatDateFns } from 'date-fns';
import { uz, ru, enUS } from 'date-fns/locale';

// ─── Locale-aware date formatting (date-fns) ──────────────────────────────────

const DATE_FNS_LOCALES = { uz, ru, en: enUS } as const;

const LOCALIZED_DATE_FORMATS = {
  en: { short: 'MMM d, yyyy', long: 'MMMM d, yyyy', full: 'EEEE, MMMM d' },
  ru: { short: 'd MMM yyyy', long: 'd MMMM yyyy', full: 'EEEE, d MMMM' },
  uz: { short: 'd-MMM, yyyy', long: 'd-MMMM, yyyy', full: 'EEEE, d-MMMM' },
} as const;

/**
 * Formats a date with locale-aware month names using date-fns' bundled
 * locale data. Unlike `Intl.DateTimeFormat`, this doesn't depend on the
 * browser's ICU data — `Intl.DateTimeFormat('uz', { month: 'short' })`
 * renders as "M06" in some browsers because their ICU data lacks abbreviated
 * Uzbek month names.
 *
 * @example formatLocalizedDate('2026-06-07', 'uz') → '7-iyun, 2026'
 * @example formatLocalizedDate('2026-06-07', 'en') → 'Jun 7, 2026'
 */
export function formatLocalizedDate(
  date: string | Date | null | undefined,
  locale: string,
  style: 'short' | 'long' | 'full' = 'short',
): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const key = locale in DATE_FNS_LOCALES ? (locale as keyof typeof DATE_FNS_LOCALES) : 'en';
  const dateFnsLocale = DATE_FNS_LOCALES[key];
  const formats = LOCALIZED_DATE_FORMATS[key];
  const formatted = formatDateFns(d, formats[style], { locale: dateFnsLocale });

  // date-fns' 'uz' locale only has capitalized month names (e.g. "Iyun"),
  // but Uzbek convention lowercases them in this position ("7-iyun, 2026").
  // The 'full' style leads with the weekday name, which keeps its capital.
  return locale === 'uz' && style !== 'full' ? formatted.toLowerCase() : formatted;
}

/**
 * Returns 1–2 uppercase initials from a first + last name pair.
 * Falls back to '?' if both are empty.
 *
 * @example formatInitials('John', 'Doe') → 'JD'
 * @example formatInitials('Alice', '')   → 'A'
 */
export function formatInitials(firstName: string, lastName: string): string {
  const f = firstName.trim().charAt(0).toUpperCase();
  const l = lastName.trim().charAt(0).toUpperCase();
  if (!f && !l) return '?';
  return `${f}${l}`.trim();
}

/**
 * Formats a number with locale-aware thousands separators.
 */
export function formatNumber(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Truncates a string to `maxLen` chars, appending '…' if truncated.
 */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen - 1)}…`;
}

/**
 * Formats an ISO date string or Date object to a human-readable date string.
 *
 * @example formatDate('2024-01-15') → 'Jan 15, 2024'
 */
export function formatDate(
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
  locale = 'en-US',
): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Formats an ISO date string or Date object to a human-readable date + time string.
 */
export function formatDateTime(
  date: string | Date | null | undefined,
  locale = 'en-US',
): string {
  return formatDate(
    date,
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    locale,
  );
}

/**
 * Formats a numeric amount as currency.
 *
 * @example formatCurrency(1500, 'UZS') → '1,500 UZS'
 * @example formatCurrency(29.99, 'USD') → '$29.99'
 */
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: currency === 'UZS' ? 0 : 2,
      maximumFractionDigits: currency === 'UZS' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(locale)} ${currency}`;
  }
}

/**
 * Formats a numeric amount as a compact currency string for space-constrained
 * UI like chart axis ticks (e.g. "21.5M UZS" instead of "21,500,000 UZS").
 *
 * @example formatCompactCurrency(21500000, 'UZS') → '21.5M UZS'
 * @example formatCompactCurrency(1500, 'USD') → '$1.5K'
 */
export function formatCompactCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(locale)} ${currency}`;
  }
}

/**
 * Formats a byte count as a human-readable file size.
 *
 * @example formatFileSize(1536) → '1.5 KB'
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exp = Math.floor(Math.log(bytes) / Math.log(1024));
  const safeExp = Math.min(exp, units.length - 1);
  const value = bytes / Math.pow(1024, safeExp);
  const unit = units[safeExp] ?? 'B';
  return `${value % 1 === 0 ? value : value.toFixed(1)} ${unit}`;
}

/**
 * Formats a number as a percentage string.
 *
 * @example formatPercentage(0.857) → '85.7%'
 * @example formatPercentage(85.7, false) → '85.7%'
 */
export function formatPercentage(
  value: number,
  isDecimal = true,
  decimals = 1,
): string {
  const pct = isDecimal ? value * 100 : value;
  return `${pct.toFixed(decimals)}%`;
}

/**
 * Returns a relative time string (e.g. "2 hours ago", "in 3 days").
 *
 * @example formatRelativeTime(new Date(Date.now() - 3600_000)) → '1 hour ago'
 */
export function formatRelativeTime(
  date: string | Date | null | undefined,
  locale = 'en-US',
): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '—';

  const diff = d.getTime() - Date.now(); // ms, negative = past
  const abs = Math.abs(diff);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (abs < 60_000) return rtf.format(Math.round(diff / 1000), 'second');
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), 'minute');
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), 'hour');
  if (abs < 2_592_000_000) return rtf.format(Math.round(diff / 86_400_000), 'day');
  if (abs < 31_536_000_000) return rtf.format(Math.round(diff / 2_592_000_000), 'month');
  return rtf.format(Math.round(diff / 31_536_000_000), 'year');
}
