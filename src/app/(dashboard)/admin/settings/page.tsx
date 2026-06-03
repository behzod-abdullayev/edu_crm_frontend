import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export { AdminSettingsClient as default } from './AdminSettingsClient';
