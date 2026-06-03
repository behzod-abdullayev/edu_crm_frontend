import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TeacherGroupDetailClient } from '@/modules/teachers/components/TeacherGroupDetailClient';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return {
    title: t('groups'),
    robots: { index: false, follow: false },
  };
}

export default async function TeacherGroupDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const { setRequestLocale } = await import('next-intl/server');
  setRequestLocale(locale);

  return <TeacherGroupDetailClient groupId={id} />;
}
