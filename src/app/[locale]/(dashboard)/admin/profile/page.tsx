/**
 * src/app/[locale]/(dashboard)/admin/profile/page.tsx
 *
 * FIX: This page was missing — clicking "Profile" in the sidebar bottom
 *      or UserMenu for admin role caused a 404 at /[locale]/admin/profile.
 */

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

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

export default async function AdminProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { AdminProfileClient } = await import('./AdminProfileClient');
  return <AdminProfileClient />;
}
