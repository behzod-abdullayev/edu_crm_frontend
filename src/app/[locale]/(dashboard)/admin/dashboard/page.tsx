import type { Metadata } from 'next';
import { AdminDashboardClient } from '@/app/(dashboard)/admin/dashboard/AdminDashboardClient';

export const metadata: Metadata = {
  title: 'Admin Dashboard — EduCRM',
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return <AdminDashboardClient />;
}
