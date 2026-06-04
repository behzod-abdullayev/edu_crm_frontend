/**
 * Admin Courses list page — /[locale]/admin/courses
 *
 * Server Component shell:
 *  1. Exports generateMetadata() for SEO/robots
 *  2. Renders AdminCoursesClient directly
 *
 * Client component handles all data fetching, table rendering,
 * CRUD operations, search, filters, and pagination.
 */

import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { AdminCoursesClient } from './AdminCoursesClient';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminCoursesPageProps {
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
    uz: "Kurslar — Admin — EduCRM",
    en: "Courses — Admin — EduCRM",
    ru: "Курсы — Админ — EduCRM",
  };

  return {
    title: titles[locale] ?? titles['en'],
    robots: { index: false, follow: false },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminCoursesPage({ params }: AdminCoursesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminCoursesClient />;
}
