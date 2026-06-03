import type { Metadata } from 'next';
import { OwnerHRClient } from '@/app/(dashboard)/owner/hr/OwnerHRClient';

export const metadata: Metadata = {
  title: 'HR — Owner — EduCRM',
  robots: { index: false, follow: false },
};

export default OwnerHRClient;
