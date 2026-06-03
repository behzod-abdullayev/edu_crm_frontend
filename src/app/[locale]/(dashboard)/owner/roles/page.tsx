import type { Metadata } from 'next';
import { OwnerRolesClient } from '@/app/(dashboard)/owner/roles/OwnerRolesClient';

export const metadata: Metadata = {
  title: 'Roles & Permissions — Owner — EduCRM',
  robots: { index: false, follow: false },
};

export default OwnerRolesClient;
