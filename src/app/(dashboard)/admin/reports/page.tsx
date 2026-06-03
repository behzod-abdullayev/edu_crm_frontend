import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reports — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export { AdminReportsClient as default } from './AdminReportsClient';
