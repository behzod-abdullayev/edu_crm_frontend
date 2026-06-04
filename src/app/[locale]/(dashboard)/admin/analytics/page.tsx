/**
 * Admin Analytics page — /[locale]/admin/analytics
 *
 * Server Component shell that:
 *  1. Exports generateMetadata() for SEO/robots control
 *  2. Renders the AdminAnalyticsClient directly
 *
 * Pattern matches other admin pages in this project:
 *  - Reports page   → imports AdminReportsClient
 *  - Payments page  → imports AdminPaymentsClient
 *  - Students page  → imports AdminStudentsClient
 *
 * The actual data-fetching and UI live in AdminAnalyticsClient.
 */

import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { AdminAnalyticsClient } from './AdminAnalyticsClient';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminAnalyticsPageProps {
  params: Promise<{ locale: string }>;
}

// ─── Static params ────────────────────────────────────────────────────────────

export function generateStaticParams(): Array<{ locale: string }> {
  return [{ locale: 'uz' }, { locale: 'en' }, { locale: 'ru' }];
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    uz: "Tahlillar — Admin — EduCRM",
    en: "Analytics — Admin — EduCRM",
    ru: "Аналитика — Админ — EduCRM",
  };

  return {
    title: titles[locale] ?? titles['en'],
    robots: { index: false, follow: false },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminAnalyticsPage({ params }: AdminAnalyticsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminAnalyticsClient />;
}
