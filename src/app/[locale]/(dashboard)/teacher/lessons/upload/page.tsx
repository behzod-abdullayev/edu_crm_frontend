import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LessonUploader } from '@/modules/teachers/components/LessonUploader';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nav' });
  return {
    title: t('lessons'),
    robots: { index: false, follow: false },
  };
}

export default async function TeacherLessonUploadPage({ params }: PageProps) {
  const { locale } = await params;
  const { setRequestLocale } = await import('next-intl/server');
  setRequestLocale(locale);

  return <LessonUploader />;
}
