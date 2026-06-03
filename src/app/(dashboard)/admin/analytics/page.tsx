import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export { AdminAnalyticsClient as default } from './AdminAnalyticsClient';
