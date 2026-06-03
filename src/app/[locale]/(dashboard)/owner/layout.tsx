// src/app/(dashboard)/owner/layout.tsx
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

async function getServerUser() {
  return { role: 'owner' as const };
}

export const metadata: Metadata = {
  title: {
    template: '%s | Owner — EduCRM',
    default: 'Owner Dashboard | EduCRM',
  },
};

export default async function OwnerLayout({ children }: { children: ReactNode }) {
  const user = await getServerUser();

  if (user.role !== 'owner') {
    redirect('/login');
  }

  return <>{children}</>;
}
