/**
 * src/app/[locale]/(dashboard)/owner/profile/page.tsx
 *
 * FIX: This page was missing — clicking "Profile" in the sidebar bottom
 *      or UserMenu caused a 404 at /[locale]/owner/profile.
 *
 * Uses the same shared profile UI as teacher (account info + change password).
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

export default async function OwnerProfilePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Dynamic import to keep this a Server Component shell
  const { OwnerProfileClient } = await import('./OwnerProfileClient');
  return <OwnerProfileClient />;
}
