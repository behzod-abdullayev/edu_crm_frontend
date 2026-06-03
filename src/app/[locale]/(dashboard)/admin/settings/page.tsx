import type { Metadata } from 'next';
import { AdminSettingsClient } from '@/app/(dashboard)/admin/settings/AdminSettingsClient';

export const metadata: Metadata = {
  title: 'Settings — Admin — EduCRM',
  robots: { index: false, follow: false },
};

export default AdminSettingsClient;
