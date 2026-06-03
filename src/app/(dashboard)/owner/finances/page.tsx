import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Finances — Owner — EduCRM',
  robots: { index: false, follow: false },
};

export { OwnerFinancesClient as default } from './OwnerFinancesClient';
