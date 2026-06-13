import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { TeacherDetailClient } from './TeacherDetailClient';

interface AdminTeacherDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    uz: "O'qituvchi profili — Admin — EduCRM",
    en: 'Teacher Profile — Admin — EduCRM',
    ru: 'Профиль преподавателя — Админ — EduCRM',
  };

  return {
    title: titles[locale] ?? titles['en'],
    robots: { index: false, follow: false },
  };
}

export default async function AdminTeacherDetailPage({ params }: AdminTeacherDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <TeacherDetailClient teacherId={id} locale={locale} />;
}
