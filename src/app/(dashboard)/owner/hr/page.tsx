import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HR — Owner — EduCRM',
  robots: { index: false, follow: false },
};

export { OwnerHRClient as default } from './OwnerHRClient';
