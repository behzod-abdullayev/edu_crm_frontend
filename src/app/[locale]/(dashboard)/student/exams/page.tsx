import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { StudentExamsClient } from '@/modules/students/components/StudentExamsClient';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return {
    title: t('exams'),
    robots: { index: false, follow: false },
  };
}

export default async function StudentExamsPage({ params }: PageProps) {
  const { locale } = await params;
  // setRequestLocale must be called in Server Components that render Client ones
  const { setRequestLocale } = await import('next-intl/server');
  setRequestLocale(locale);

  return <StudentExamsClient />;
}
