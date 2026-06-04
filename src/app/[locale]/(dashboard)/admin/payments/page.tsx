// src/app/[locale]/(dashboard)/admin/payments/page.tsx

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { AdminPaymentsClient } from '@/modules/admin/components/AdminPaymentsClient';
import { AdminPaymentsSkeleton } from '@/modules/admin/components/AdminPaymentsSkeleton';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return {
    title: t('payments.title'),
    robots: { index: false, follow: false },
  };
}

export default async function AdminPaymentsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<AdminPaymentsSkeleton />}>
      <AdminPaymentsClient />
    </Suspense>
  );
}
