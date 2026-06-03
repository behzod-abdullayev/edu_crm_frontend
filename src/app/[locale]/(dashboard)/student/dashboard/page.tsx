import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { StudentDashboardClient } from '@/modules/students/components/StudentDashboardClient';
import { Suspense } from 'react';
import { StudentDashboardSkeleton } from '@/modules/students/components/StudentDashboardSkeleton';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return {
    title: t('dashboard'),
    robots: { index: false, follow: false },
  };
}

export default async function StudentDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  // setRequestLocale must be called in Server Components that render Client ones
  const { setRequestLocale } = await import('next-intl/server');
  setRequestLocale(locale);

  return (
    <Suspense fallback={<StudentDashboardSkeleton />}>
      <StudentDashboardClient />
    </Suspense>
  );
}
