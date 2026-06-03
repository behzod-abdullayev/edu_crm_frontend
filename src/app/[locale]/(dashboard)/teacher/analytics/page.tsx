import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TeacherAnalyticsClient } from '@/modules/teachers/components/TeacherAnalyticsClient';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return {
    title: t('analytics'),
    robots: { index: false, follow: false },
  };
}

export default async function TeacherAnalyticsPage({ params }: PageProps) {
  const { locale } = await params;
  // setRequestLocale must be called in Server Components that render Client ones
  const { setRequestLocale } = await import('next-intl/server');
  setRequestLocale(locale);

  return <TeacherAnalyticsClient />;
}
