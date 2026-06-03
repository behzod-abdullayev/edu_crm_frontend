import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { StudentProfileClient } from '@/modules/students/components/StudentProfileClient';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return {
    title: t('profile'),
    robots: { index: false, follow: false },
  };
}

export default async function StudentProfilePage({ params }: PageProps) {
  const { locale } = await params;
  // setRequestLocale must be called in Server Components that render Client ones
  const { setRequestLocale } = await import('next-intl/server');
  setRequestLocale(locale);

  return <StudentProfileClient />;
}
