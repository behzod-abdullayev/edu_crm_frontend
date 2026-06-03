import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Users — Owner — EduCRM',
  robots: { index: false, follow: false },
};

export { OwnerUsersClient as default } from './OwnerUsersClient';
