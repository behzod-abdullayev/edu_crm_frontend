import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { StudentAttendanceClient } from '@/modules/students/components/StudentAttendanceClient';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return {
    title: t('attendance'),
    robots: { index: false, follow: false },
  };
}

export default async function StudentAttendancePage({ params }: PageProps) {
  const { locale } = await params;
  // setRequestLocale must be called in Server Components that render Client ones
  const { setRequestLocale } = await import('next-intl/server');
  setRequestLocale(locale);

  return <StudentAttendanceClient />;
}
