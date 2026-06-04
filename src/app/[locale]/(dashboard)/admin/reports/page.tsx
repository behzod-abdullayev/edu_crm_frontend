// src/app/[locale]/(dashboard)/admin/reports/page.tsx

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { AdminReportsClient } from '@/modules/admin/components/AdminReportsClient';
import { AdminReportsSkeleton } from '@/modules/admin/components/AdminReportsSkeleton';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return {
    title: t('reports.title'),
    robots: { index: false, follow: false },
  };
}

export default async function AdminReportsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<AdminReportsSkeleton />}>
      <AdminReportsClient />
    </Suspense>
  );
}
