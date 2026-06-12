/**
 * src/app/[locale]/(dashboard)/admin/students/page.tsx
 *
 * Server-component shell: provides generateMetadata() for the page <title>
 * and renders the AdminStudentsClient component.
 */

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return {
    title: t('students.title'),
    robots: { index: false, follow: false },
  };
}

export default async function AdminStudentsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { AdminStudentsClient } = await import('./AdminStudentsClient');
  return <AdminStudentsClient />;
}
