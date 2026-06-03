import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roles & Permissions — Owner — EduCRM',
  robots: { index: false, follow: false },
};

export { OwnerRolesClient as default } from './OwnerRolesClient';
