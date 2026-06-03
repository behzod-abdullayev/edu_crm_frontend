import type { Metadata } from 'next';
import { AdminScheduleClient } from '@/app/(dashboard)/admin/schedule/AdminScheduleClient';

export const metadata: Metadata = {
  title: 'Schedule — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export default AdminScheduleClient;
