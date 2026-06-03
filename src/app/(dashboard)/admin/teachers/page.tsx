import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Teachers — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export { AdminTeachersClient as default } from './AdminTeachersClient';
