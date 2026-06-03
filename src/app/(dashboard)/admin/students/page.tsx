import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Students — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export { AdminStudentsClient as default } from './AdminStudentsClient';
