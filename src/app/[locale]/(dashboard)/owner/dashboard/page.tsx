import type { Metadata } from 'next';
import { OwnerDashboardClient } from '@/app/(dashboard)/owner/dashboard/OwnerDashboardClient';

export const metadata: Metadata = {
  title: 'Owner Dashboard — Owner — EduCRM',
  robots: { index: false, follow: false },
};

export default OwnerDashboardClient;
