/**
 * Admin Course Detail page — /[locale]/admin/courses/[id]
 *
 * Server Component shell that:
 *  1. Exports generateMetadata() (noindex, dynamic title)
 *  2. Reads [id] + optional ?edit=1 from params/searchParams
 *  3. Renders AdminCourseDetailClient with those values
 *
 * Next.js 15: params and searchParams are Promises — must be awaited.
 */

import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { AdminCourseDetailClient } from './AdminCourseDetailClient';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AdminCourseDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ edit?: string }>;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    uz: "Kurs tafsilotlari — Admin — EduCRM",
    en: "Course Detail — Admin — EduCRM",
    ru: "Детали курса — Админ — EduCRM",
  };

  return {
    title: titles[locale] ?? titles['en'],
    robots: { index: false, follow: false },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminCourseDetailPage({
  params,
  searchParams,
}: AdminCourseDetailPageProps) {
  const { locale, id } = await params;
  const { edit } = await searchParams;

  setRequestLocale(locale);

  return (
    <AdminCourseDetailClient
      courseId={id}
      startInEditMode={edit === '1'}
      locale={locale}
    />
  );
}
