// src/app/(dashboard)/admin/layout.tsx
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

async function getServerUser() {
  return { role: 'admin' as const };
}

const ALLOWED_ROLES = ['admin', 'owner'] as const;

export const metadata: Metadata = {
  title: {
    template: '%s | Admin — EduCRM',
    default: 'Admin Dashboard | EduCRM',
  },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getServerUser();

  if (!(ALLOWED_ROLES as readonly string[]).includes(user.role)) {
    redirect('/login');
  }

  return <>{children}</>;
}
