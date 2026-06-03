import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Schedule — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export { AdminScheduleClient as default } from './AdminScheduleClient';
