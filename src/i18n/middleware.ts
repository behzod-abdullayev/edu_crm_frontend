import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { i18nConfig } from '@/config/i18n.config';
import type { Locale } from '@/config/site.config';
import type { AbstractIntlMessages } from 'next-intl';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  if (!locale || !i18nConfig.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = (await import(`./locales/${locale}.json`)) as AbstractIntlMessages;

  return {
    locale,
    messages,
    timeZone: 'Asia/Tashkent',
    now: new Date(),
  };
});