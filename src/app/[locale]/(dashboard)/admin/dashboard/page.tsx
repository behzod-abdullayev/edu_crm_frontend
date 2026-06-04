// src/app/[locale]/(dashboard)/admin/dashboard/page.tsx

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { AdminDashboardClient } from '@/modules/admin/components/AdminDashboardClient';
import { AdminDashboardSkeleton } from '@/modules/admin/components/AdminDashboardSkeleton';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return {
    title: t('dashboard.title'),
    robots: { index: false, follow: false },
  };
}

export default async function AdminDashboardPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<AdminDashboardSkeleton />}>
      <AdminDashboardClient />
    </Suspense>
  );
}
