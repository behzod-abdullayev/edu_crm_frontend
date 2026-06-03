import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Branches — Owner — EduCRM',
  robots: { index: false, follow: false },
};

export { OwnerBranchesClient as default } from './OwnerBranchesClient';
