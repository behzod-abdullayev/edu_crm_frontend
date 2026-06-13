import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { StudentDetailClient } from './StudentDetailClient';

interface AdminStudentDetailPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const titles: Record<string, string> = {
    uz: "O'quvchi profili — Admin — EduCRM",
    en: 'Student Profile — Admin — EduCRM',
    ru: 'Профиль студента — Админ — EduCRM',
  };

  return {
    title: titles[locale] ?? titles['en'],
    robots: { index: false, follow: false },
  };
}

export default async function AdminStudentDetailPage({ params }: AdminStudentDetailPageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <StudentDetailClient studentId={id} locale={locale} />;
}
