import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Owner Dashboard — EduCRM',
  robots: { index: false, follow: false },
};

export { OwnerDashboardClient as default } from './OwnerDashboardClient';
