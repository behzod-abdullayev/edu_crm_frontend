// src/app/(dashboard)/student/layout.tsx
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

// Replace with real auth helper from your project
async function getServerUser() {
  // e.g.: return await getSession() or cookies-based auth check
  return { role: 'student' as const };
}

export const metadata: Metadata = {
  title: {
    template: '%s | Student — EduCRM',
    default: 'Student Dashboard | EduCRM',
  },
  description: 'Your personal learning dashboard.',
};

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await getServerUser();

  if (user.role !== 'student') {
    redirect(`/${user.role}`);
  }

  return <>{children}</>;
}
