import type { Metadata } from 'next';
import { AdminPaymentDetailClient } from '@/app/(dashboard)/admin/payments/[id]/AdminPaymentDetailClient';

export const metadata: Metadata = {
  title: 'Invoice Detail — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export default AdminPaymentDetailClient;
