// src/app/[locale]/(dashboard)/admin/payments/[id]/page.tsx

import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';
import { AdminPaymentDetailClient } from '@/modules/admin/components/AdminPaymentDetailClient';
import { AdminPaymentDetailSkeleton } from '@/modules/admin/components/AdminPaymentDetailSkeleton';

type PageProps = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin' });
  return {
    title: t('payments.invoice'),
    robots: { index: false, follow: false },
  };
}

export default async function AdminPaymentDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<AdminPaymentDetailSkeleton />}>
      <AdminPaymentDetailClient invoiceId={id} />
    </Suspense>
  );
}
