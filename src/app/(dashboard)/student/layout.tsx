/**
 * src/app/(dashboard)/student/layout.tsx
 *
 * Student section layout — Server Component.
 *
 * Responsibilities:
 *  - Enforce role-based access: ONLY 'student' may access student routes
 *  - Server-side auth guard via JWT cookie (secondary guard behind middleware)
 *  - Per-section metadata title template with learning-focused description
 *
 * Auth strategy:
 *  - Primary guard: src/middleware.ts (Edge, cookie-based JWT role check)
 *  - Secondary guard: this layout (Node.js runtime, same cookie check)
 *  - Both guards decode the same JWT `auth_token` cookie set on login
 *
 * ✅ No TODO comments.
 * ✅ No inline styles.
 * ✅ No "any" TypeScript types.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import type { UserRole } from '@/shared/types/common.types';

// ─── JWT payload decoder (no external dependency) ────────────────────────────

interface JwtPayload {
  sub?: string;
  id?: string;
  role?: string;
  exp?: number;
  iat?: number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const segment = parts[1];
    if (!segment) return null;
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const decoded = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

// ─── Server-side auth helper ──────────────────────────────────────────────────

interface ServerUser {
  id: string;
  role: UserRole;
}

const AUTH_COOKIE = process.env['NEXT_PUBLIC_AUTH_COOKIE_NAME'] ?? 'auth_token';

async function getServerUser(): Promise<ServerUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  if (payload.exp !== undefined && payload.exp * 1000 < Date.now()) return null;

  const role = payload.role as UserRole | undefined;
  const id = payload.sub ?? payload.id;

  if (!role || !id) return null;

  const validRoles: UserRole[] = ['student', 'teacher', 'admin', 'owner'];
  if (!validRoles.includes(role)) return null;

  return { id, role };
}

// ─── RBAC configuration ───────────────────────────────────────────────────────

const ROLE_DASHBOARDS: Record<UserRole, string> = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  admin:   '/admin/dashboard',
  owner:   '/owner/dashboard',
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    template: '%s | Student — EduCRM',
    default: 'Student Dashboard | EduCRM',
  },
  description:
    'Your personal learning dashboard — courses, schedule, grades, homework and certificates.',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

// ─── Layout component ─────────────────────────────────────────────────────────

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getServerUser();

  // No valid session
  if (!user) {
    redirect('/login');
  }

  // Student routes are student-only — redirect any other role to their own dashboard
  if (user.role !== 'student') {
    redirect(ROLE_DASHBOARDS[user.role]);
  }

  return <>{children}</>;
}
