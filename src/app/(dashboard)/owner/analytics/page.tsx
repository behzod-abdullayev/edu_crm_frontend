import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics — Owner — EduCRM',
  robots: { index: false, follow: false },
};

export { OwnerAnalyticsClient as default } from './OwnerAnalyticsClient';
