import type { Metadata } from 'next';
import { OwnerUsersClient } from '@/app/(dashboard)/owner/users/OwnerUsersClient';

export const metadata: Metadata = {
  title: 'Users — Owner — EduCRM',
  robots: { index: false, follow: false },
};

export default OwnerUsersClient;
