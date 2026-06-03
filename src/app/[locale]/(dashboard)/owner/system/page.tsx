import type { Metadata } from 'next';
import { OwnerSystemClient } from '@/app/(dashboard)/owner/system/OwnerSystemClient';

export const metadata: Metadata = {
  title: 'System — Owner — EduCRM',
  robots: { index: false, follow: false },
};

export default OwnerSystemClient;
