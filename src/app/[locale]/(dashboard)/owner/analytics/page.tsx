import type { Metadata } from 'next';
import { OwnerAnalyticsClient } from '@/app/(dashboard)/owner/analytics/OwnerAnalyticsClient';

export const metadata: Metadata = {
  title: 'Analytics — Owner — EduCRM',
  robots: { index: false, follow: false },
};

export default OwnerAnalyticsClient;
