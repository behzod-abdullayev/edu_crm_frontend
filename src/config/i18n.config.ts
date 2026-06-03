import type { Locale } from '@config/site.config';
import { siteConfig } from '@config/site.config';

export const i18nConfig = {
  locales:       siteConfig.locales,
  defaultLocale: siteConfig.defaultLocale,
  localePrefix:  'always' as const,
} satisfies {
  locales: readonly Locale[];
  defaultLocale: Locale;
  localePrefix: 'always' | 'as-needed' | 'never';
};

export type I18nConfig = typeof i18nConfig;
