import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payments — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export { AdminPaymentsClient as default } from './AdminPaymentsClient';
