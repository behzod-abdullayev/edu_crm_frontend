// src/app/[locale]/(dashboard)/admin/schedule/page.tsx

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { AdminScheduleClient } from '@/modules/admin/components/AdminScheduleClient';
import { AdminScheduleSkeleton } from '@/modules/admin/components/AdminScheduleSkeleton';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return {
    title: t('schedule.title'),
    robots: { index: false, follow: false },
  };
}

export default async function AdminSchedulePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<AdminScheduleSkeleton />}>
      <AdminScheduleClient />
    </Suspense>
  );
}
