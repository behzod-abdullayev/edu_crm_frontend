import type { Metadata } from 'next';
import { AdminAnalyticsClient } from '@/app/(dashboard)/admin/analytics/AdminAnalyticsClient';

export const metadata: Metadata = {
  title: 'Analytics — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export default AdminAnalyticsClient;
