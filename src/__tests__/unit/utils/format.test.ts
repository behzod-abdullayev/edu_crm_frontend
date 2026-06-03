import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatDate,
  formatCurrency,
  formatFileSize,
  formatInitials,
  formatPercentage,
  truncate,
  formatRelativeTime,
} from '@/shared/utils/format';

describe('formatDate', () => {
  it('formats a valid ISO date string to locale date', () => {
    const result = formatDate('2024-03-15');
    expect(result).toMatch(/15/);
  });

  it('formats a Date object', () => {
    const date = new Date(2024, 2, 15); // March 15 2024
    const result = formatDate(date);
    expect(result).toMatch(/15/);
  });

  it('returns em-dash for null input', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns em-dash for undefined input', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('formats with custom Intl.DateTimeFormatOptions', () => {
    // formatDate accepts Intl.DateTimeFormatOptions as second argument
    const result = formatDate('2024-03-15', { year: 'numeric', month: '2-digit', day: '2-digit' });
    expect(result).toMatch(/2024/);
    expect(result).toMatch(/03|3/);
    expect(result).toMatch(/15/);
  });

  it('formats with short month option', () => {
    const result = formatDate('2024-03-15', { month: 'short', year: 'numeric' });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toMatch(/2024/);
  });

  it('handles invalid date string gracefully', () => {
    const result = formatDate('not-a-date');
    expect(result).toBe('—');
  });

  it('formats Date object including year', () => {
    const date = new Date('2024-06-01T00:00:00Z');
    const result = formatDate(date);
    expect(result).toMatch(/2024/);
  });
});

describe('formatCurrency', () => {
  it('formats UZS currency', () => {
    const result = formatCurrency(1500000, 'UZS');
    expect(result).toMatch(/1.500.000|1,500,000/);
  });

  it('formats USD currency', () => {
    const result = formatCurrency(99.99, 'USD');
    expect(result).toMatch(/99/);
    expect(result).toMatch(/\$|\bUSD\b/);
  });

  it('formats EUR currency', () => {
    const result = formatCurrency(250, 'EUR');
    expect(result).toMatch(/250/);
    expect(result).toMatch(/€|\bEUR\b/);
  });

  it('formats zero correctly', () => {
    const result = formatCurrency(0, 'UZS');
    expect(result).toMatch(/0/);
  });

  it('formats large numbers with separators', () => {
    const result = formatCurrency(10000000, 'UZS');
    expect(result.replace(/[^0-9]/g, '').length).toBeLessThan(9);
  });

  it('rounds to 2 decimal places for USD', () => {
    const result = formatCurrency(10.999, 'USD');
    expect(result).toMatch(/11\.00|11,00/);
  });

  it('defaults to USD if currency not provided', () => {
    const result = formatCurrency(5000);
    expect(result).toMatch(/5.000|5,000|5000/);
  });
});

describe('formatFileSize', () => {
  it('formats bytes below 1KB', () => {
    expect(formatFileSize(500)).toMatch(/500\s*B/i);
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toMatch(/1\s*KB/i);
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1024 * 1024)).toMatch(/1\s*MB/i);
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(1024 * 1024 * 1024)).toMatch(/1\s*GB/i);
  });

  it('formats 1.5 MB correctly', () => {
    expect(formatFileSize(1.5 * 1024 * 1024)).toMatch(/1\.5\s*MB/i);
  });

  it('formats 0 bytes', () => {
    expect(formatFileSize(0)).toMatch(/0\s*B/i);
  });

  it('formats fractional KB', () => {
    expect(formatFileSize(2048)).toMatch(/2\s*KB/i);
  });
});

describe('formatInitials', () => {
  it('returns initials from first and last name', () => {
    expect(formatInitials('John', 'Doe')).toBe('JD');
  });

  it('returns single initial when lastName is empty', () => {
    const result = formatInitials('Alice', '');
    expect(result).toMatch(/^A/i);
  });

  it('returns fallback for both empty inputs', () => {
    expect(formatInitials('', '')).toBe('?');
  });

  it('uppercases initials', () => {
    expect(formatInitials('john', 'doe')).toBe('JD');
  });

  it('handles single character names', () => {
    const result = formatInitials('A', 'B');
    expect(result).toBe('AB');
  });

  it('trims whitespace from names', () => {
    expect(formatInitials('  John  ', '  Doe  ')).toBe('JD');
  });
});

describe('formatPercentage', () => {
  it('formats decimal 0 as 0.0%', () => {
    // isDecimal=true (default): 0 * 100 = 0
    expect(formatPercentage(0)).toMatch(/0/);
    expect(formatPercentage(0)).toMatch(/%/);
  });

  it('formats decimal 1 as 100%', () => {
    // isDecimal=true: 1 * 100 = 100
    expect(formatPercentage(1)).toMatch(/100/);
    expect(formatPercentage(1)).toMatch(/%/);
  });

  it('formats decimal 0.5 as 50%', () => {
    // isDecimal=true: 0.5 * 100 = 50
    expect(formatPercentage(0.5)).toMatch(/50/);
    expect(formatPercentage(0.5)).toMatch(/%/);
  });

  it('formats non-decimal 33.333 with 2 decimal places', () => {
    // isDecimal=false: value used as-is
    expect(formatPercentage(33.333, false, 2)).toMatch(/33\.33%/);
  });

  it('formats non-decimal with 0 decimal places by default decimals=1', () => {
    // isDecimal=false, decimals=1 → "33.7%"
    expect(formatPercentage(33.7, false, 1)).toMatch(/33\.7%/);
  });

  it('handles non-decimal values greater than 100', () => {
    expect(formatPercentage(150, false)).toMatch(/150/);
    expect(formatPercentage(150, false)).toMatch(/%/);
  });
});

describe('truncate', () => {
  it('returns string unchanged when below max length', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('returns string unchanged when equal to max length', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });

  it('truncates string when above max length', () => {
    const result = truncate('Hello World', 5);
    // Original is 11 chars, truncated to 5-1=4 chars + ellipsis char
    expect(result.length).toBeLessThanOrEqual(8);
  });

  it('appends ellipsis when truncated', () => {
    expect(truncate('Hello World', 5)).toMatch(/\.{2,3}$|…$/);
  });

  it('returns empty string for empty input', () => {
    expect(truncate('', 10)).toBe('');
  });

  it('handles max length of 1', () => {
    const result = truncate('Hello', 1);
    // maxLen=1: slice(0, 0) + '…' → '…'
    expect(result.length).toBeLessThanOrEqual(3);
  });
});

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "now" or seconds for dates within last minute', () => {
    const date = new Date('2024-06-15T11:59:30Z');
    const result = formatRelativeTime(date);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns minutes ago for dates within last hour', () => {
    const date = new Date('2024-06-15T11:45:00Z');
    const result = formatRelativeTime(date);
    expect(result).toMatch(/15\s*min|15\s*мин|15\s*дақ/i);
  });

  it('returns hours ago for dates within same day', () => {
    const date = new Date('2024-06-15T10:00:00Z');
    const result = formatRelativeTime(date);
    expect(result).toMatch(/2\s*hour|2\s*час|2\s*soat/i);
  });

  it('returns yesterday for yesterday date', () => {
    const date = new Date('2024-06-14T12:00:00Z');
    const result = formatRelativeTime(date);
    expect(result).toMatch(/yesterday|вчера|yesterday/i);
  });

  it('returns non-empty string for older dates', () => {
    const date = new Date('2024-01-01T00:00:00Z');
    const result = formatRelativeTime(date);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('handles future dates gracefully', () => {
    const date = new Date('2024-06-16T12:00:00Z');
    const result = formatRelativeTime(date);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns em-dash for null', () => {
    expect(formatRelativeTime(null)).toBe('—');
  });

  it('returns em-dash for undefined', () => {
    expect(formatRelativeTime(undefined)).toBe('—');
  });
});