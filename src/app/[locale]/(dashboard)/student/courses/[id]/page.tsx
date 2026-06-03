import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { StudentCourseDetailClient } from '@/modules/courses/components/StudentCourseDetailClient';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return {
    title: t('courses'),
    robots: { index: false, follow: false },
  };
}

export default async function StudentCourseDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const { setRequestLocale } = await import('next-intl/server');
  setRequestLocale(locale);

  return <StudentCourseDetailClient courseId={id} />;
}
