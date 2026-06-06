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

  // ✅ FIX 3: Dynamic import() JSON faylni { default: {...} } ko'rinishida qaytaradi
  // Oldin: `(await import(...)) as AbstractIntlMessages` — bu noto'g'ri edi!
  // Endi: `.default` dan foydalanamiz, yoki fallback sifatida modulni o'zini ishlatamiz
  const messagesModule = (await import(`./locales/${locale}.json`)) as {
    default: AbstractIntlMessages;
  } & AbstractIntlMessages;
  const messages = (messagesModule.default ?? messagesModule) as AbstractIntlMessages;

  return {
    locale,
    messages,
    timeZone: 'Asia/Tashkent',
    now: new Date(),
  };
});