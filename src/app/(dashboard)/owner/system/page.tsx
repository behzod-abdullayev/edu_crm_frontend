import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System — Owner — EduCRM',
  robots: { index: false, follow: false },
};

export { OwnerSystemClient as default } from './OwnerSystemClient';
