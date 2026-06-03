import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Courses — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export { AdminCoursesClient as default } from './AdminCoursesClient';
