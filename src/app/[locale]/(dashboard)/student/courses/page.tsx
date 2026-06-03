import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { StudentCoursesClient } from '@/modules/students/components/StudentCoursesClient';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return {
    title: t('courses'),
    robots: { index: false, follow: false },
  };
}

export default async function StudentCoursesPage({ params }: PageProps) {
  const { locale } = await params;
  const { setRequestLocale } = await import('next-intl/server');
  setRequestLocale(locale);

  return <StudentCoursesClient />;
}
