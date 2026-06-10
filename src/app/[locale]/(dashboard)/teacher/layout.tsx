// src/app/(dashboard)/teacher/layout.tsx
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

async function getServerUser() {
  return { role: 'teacher' as const };
}

const ALLOWED_ROLES = ['teacher', 'admin', 'owner'] as const;

export const metadata: Metadata = {
  title: {
    template: '%s | Teacher — EduCRM',
    default: 'Teacher Dashboard | EduCRM',
  },
};

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const user = await getServerUser();

  if (!(ALLOWED_ROLES as readonly string[]).includes(user.role)) {
    redirect(`/${user.role}`);
  }

  return <>{children}</>;
}
