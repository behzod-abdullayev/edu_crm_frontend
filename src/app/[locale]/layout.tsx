/**
 * src/app/[locale]/layout.tsx
 *
 * [locale] route group uchun SERVER COMPONENT layout.
 * Vazifasi:
 *  - next-intl messages ni server-side load qilish
 *  - NextIntlClientProvider orqali barcha child componentlarga locale + messages uzatish
 *  - AppProviders (ThemeProvider, QueryProvider, Toast, Socket) ni wrap qilish
 *
 * ⚠️  Bu fayl 'use client' BO'LMASLIGI KERAK — Server Component!
 *     next-intl getRequestConfig() server-side ishlaydi va messages shu yerda yuklanadi.
 *
 * ✅ Zero `any` types.
 * ✅ Next.js 15 App Router — params: Promise<{ locale: string }>.
 * ✅ setRequestLocale() — static rendering uchun.
 */

import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { setRequestLocale, getMessages } from 'next-intl/server';
import { AppProviders } from '@/providers/AppProviders';
import { i18nConfig } from '@/config/i18n.config';
import type { Locale } from '@/config/site.config';

// ─── Props ────────────────────────────────────────────────────────────────────

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Noto'g'ri locale → 404
  if (!i18nConfig.locales.includes(locale as Locale)) {
    notFound();
  }

  // next-intl static rendering uchun kerak
  setRequestLocale(locale);

  // Server-side messages yuklash
  const messages = await getMessages();

  return (
    <AppProviders
      locale={locale}
      messages={messages}
      timeZone="Asia/Tashkent"
    >
      {children}
    </AppProviders>
  );
}

// ─── Static params ────────────────────────────────────────────────────────────

export function generateStaticParams(): Array<{ locale: string }> {
  return i18nConfig.locales.map((locale) => ({ locale }));
}