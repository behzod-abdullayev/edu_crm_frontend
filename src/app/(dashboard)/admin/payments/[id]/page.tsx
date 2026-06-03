import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invoice Detail — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export { AdminPaymentDetailClient as default } from './AdminPaymentDetailClient';
