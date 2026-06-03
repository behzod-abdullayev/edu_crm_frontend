import type { Metadata } from 'next';
import { OwnerFinancesClient } from '@/app/(dashboard)/owner/finances/OwnerFinancesClient';

export const metadata: Metadata = {
  title: 'Finances — Owner — EduCRM',
  robots: { index: false, follow: false },
};

export default OwnerFinancesClient;
