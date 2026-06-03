import type { Metadata } from 'next';
import { AdminReportsClient } from '@/app/(dashboard)/admin/reports/AdminReportsClient';

export const metadata: Metadata = {
  title: 'Reports — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export default AdminReportsClient;
