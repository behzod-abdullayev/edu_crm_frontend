import type { Metadata } from 'next';
import { AdminStudentsClient } from '@/app/(dashboard)/admin/students/AdminStudentsClient';

export const metadata: Metadata = {
  title: 'Students — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export default AdminStudentsClient;
