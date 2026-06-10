// src/app/[locale]/(dashboard)/owner/layout.tsx
//
// ✅ XATO 12 FIXED: getServerUser now reads auth_token cookie and calls
//   /auth/me to verify the real JWT — no longer stubs { role: 'owner' }

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

interface ServerUser {
  role: string;
  id: string;
  email: string;
}

// ✅ XATO 12 FIX: Real JWT verification via /auth/me
async function getServerUser(): Promise<ServerUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) return null;

  try {
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4001';
    const res = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // Do not cache — always re-validate on each request
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const user = (await res.json()) as ServerUser;
    return user;
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: {
    template: '%s | Owner — EduCRM',
    default: 'Owner Dashboard | EduCRM',
  },
};

export default async function OwnerLayout({ children }: { children: ReactNode }) {
  const user = await getServerUser();

  // Not authenticated → login page
  if (!user) {
    redirect('/login');
  }

  // Authenticated but wrong role → their own dashboard
  if (user.role !== 'owner') {
    redirect(`/${user.role}/dashboard`);
  }

  return <>{children}</>;
}
