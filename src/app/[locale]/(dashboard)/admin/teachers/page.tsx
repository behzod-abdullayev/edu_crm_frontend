/**
 * src/app/[locale]/(dashboard)/admin/teachers/page.tsx
 *
 * Server-component shell: provides generateMetadata() for the page <title>
 * and renders the AdminTeachersClient component.
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
    title: t('teachers.title'),
    robots: { index: false, follow: false },
  };
}

export default async function AdminTeachersPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { AdminTeachersClient } = await import('./AdminTeachersClient');
  return <AdminTeachersClient />;
}
