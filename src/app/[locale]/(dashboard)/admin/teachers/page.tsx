import type { Metadata } from 'next';
import { AdminTeachersClient } from '@/app/(dashboard)/admin/teachers/AdminTeachersClient';

export const metadata: Metadata = {
  title: 'Teachers — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export default AdminTeachersClient;
