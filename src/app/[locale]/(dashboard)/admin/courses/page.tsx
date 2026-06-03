import type { Metadata } from 'next';
import { AdminCoursesClient } from '@/app/(dashboard)/admin/courses/AdminCoursesClient';

export const metadata: Metadata = {
  title: 'Courses — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export default AdminCoursesClient;
