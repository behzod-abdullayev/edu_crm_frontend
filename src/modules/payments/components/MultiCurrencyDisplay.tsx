'use client';

import { Currency } from '../types/payment.types';

const LOCALE_MAP: Record<Currency, string> = {
  UZS: 'uz-UZ',
  USD: 'en-US',
  EUR: 'de-DE',
  RUB: 'ru-RU',
};

const CURRENCY_SYMBOL: Record<Currency, string> = {
  UZS: "so'm",
  USD: '$',
  EUR: '€',
  RUB: '₽',
};

interface MultiCurrencyDisplayProps {
  amount: number;
  currency: Currency;
  showOriginal?: boolean;
  className?: string;
}

function formatCurrency(amount: number, currency: Currency): string {
  if (currency === 'UZS') {
    return `${new Intl.NumberFormat('uz-UZ').format(amount)} ${CURRENCY_SYMBOL.UZS}`;
  }

  return new Intl.NumberFormat(LOCALE_MAP[currency], {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function MultiCurrencyDisplay({
  amount,
  currency,
  showOriginal = true,
  className = '',
}: MultiCurrencyDisplayProps) {
  const primary = formatCurrency(amount, currency);

  const uzsRate: Record<Exclude<Currency, 'UZS'>, number> = {
    USD: 12_650,
    EUR: 13_800,
    RUB: 140,
  };

  const getConversions = (): { currency: Currency; formatted: string }[] => {
    if (currency === 'UZS') {
      return [
        {
          currency: 'USD',
          formatted: formatCurrency(amount / uzsRate.USD, 'USD'),
        },
      ];
    }

    return [
      {
        currency: 'UZS',
        formatted: formatCurrency(
          amount * uzsRate[currency as Exclude<Currency, 'UZS'>],
          'UZS'
        ),
      },
    ];
  };

  const conversions = getConversions();

  return (
    <span className={`inline-flex flex-col ${className}`}>
      <span className="font-semibold tabular-nums">{primary}</span>
      {showOriginal && conversions.length > 0 && (
        <span className="text-xs text-muted-foreground tabular-nums">
          ≈ {conversions[0]?.formatted}
        </span>
      )}
    </span>
  );
}
