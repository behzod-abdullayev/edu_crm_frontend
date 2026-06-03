import type { Metadata } from 'next';
import { OwnerBranchesClient } from '@/app/(dashboard)/owner/branches/OwnerBranchesClient';

export const metadata: Metadata = {
  title: 'Branches — Owner — EduCRM',
  robots: { index: false, follow: false },
};

export default OwnerBranchesClient;
