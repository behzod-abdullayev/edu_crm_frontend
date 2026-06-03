import type { Metadata } from 'next';
import { AdminPaymentsClient } from '@/app/(dashboard)/admin/payments/AdminPaymentsClient';

export const metadata: Metadata = {
  title: 'Payments — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export default AdminPaymentsClient;
