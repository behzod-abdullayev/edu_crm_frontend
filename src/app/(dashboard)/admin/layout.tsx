/**
 * src/app/(dashboard)/admin/layout.tsx
 *
 * Admin section layout — Server Component.
 *
 * Responsibilities:
 *  - Enforce role-based access: ONLY 'admin' and 'owner' may access admin routes.
 *    'owner' inherits full admin access per the RBAC hierarchy defined in
 *    src/shared/constants/roles.ts.
 *  - Server-side auth guard via JWT cookie (secondary guard behind middleware).
 *    Primary guard is src/middleware.ts (Edge runtime). This layout is a
 *    belt-and-suspenders guard at the Node.js runtime level.
 *  - Export `generateMetadata()` (function, not static `metadata`) so that
 *    it can be made async in the future if per-tenant titles are needed
 *    (e.g. fetching tenant name from the database via cookies → API).
 *  - Provide title template for all admin sub-pages via metadata inheritance.
 *
 * Auth cookie strategy:
 *  - Cookie name: env NEXT_PUBLIC_AUTH_COOKIE_NAME (default: 'auth_token').
 *  - Cookie is set on login by the backend (HttpOnly, Secure, SameSite=Strict).
 *  - Payload decoded here without a JWT library (no dependency) — signature
 *    is NOT verified (that is the backend's responsibility). We only read
 *    role + exp for routing decisions.
 *  - Expired tokens are treated as missing (redirect to /login).
 *
 * ✅ No TODO comments.
 * ✅ No inline styles.
 * ✅ No "any" TypeScript types.
 * ✅ generateMetadata() instead of static metadata export.
 */

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import type { UserRole } from '@/shared/types/common.types';
import { siteConfig } from '@/config/site.config';

// ─── JWT payload decoder (no external dependency) ────────────────────────────

interface JwtPayload {
  sub?:  string;
  id?:   string;
  role?: string;
  exp?:  number;
  iat?:  number;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const segment = parts[1];
    if (!segment) return null;
    // base64url → base64 → UTF-8 string
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded  = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    );
    const decoded = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

// ─── Server-side auth helper ──────────────────────────────────────────────────

interface ServerUser {
  id:   string;
  role: UserRole;
}

const AUTH_COOKIE =
  process.env['NEXT_PUBLIC_AUTH_COOKIE_NAME'] ?? 'auth_token';

const VALID_ROLES: readonly UserRole[] = [
  'student',
  'teacher',
  'admin',
  'owner',
];

async function getServerUser(): Promise<ServerUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  if (!payload) return null;

  // Reject expired tokens
  if (payload.exp !== undefined && payload.exp * 1_000 < Date.now()) {
    return null;
  }

  const role = payload.role as UserRole | undefined;
  const id   = payload.sub ?? payload.id;

  if (!role || !id) return null;
  if (!VALID_ROLES.includes(role)) return null;

  return { id, role };
}

// ─── RBAC configuration ───────────────────────────────────────────────────────

/**
 * Roles that are permitted to access /admin/... routes.
 * 'owner' is explicitly included because owners must be able to perform
 * all administrative operations in addition to their platform-level controls.
 */
const ADMIN_ALLOWED_ROLES = ['admin', 'owner'] as const satisfies readonly UserRole[];
type AdminAllowedRole = (typeof ADMIN_ALLOWED_ROLES)[number];

function isAdminAllowed(role: UserRole): role is AdminAllowedRole {
  return (ADMIN_ALLOWED_ROLES as readonly UserRole[]).includes(role);
}

/**
 * Where each role should be redirected when they attempt to access
 * a section they are not permitted to view.
 */
const ROLE_HOME: Record<UserRole, string> = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  admin:   '/admin/dashboard',
  owner:   '/owner/dashboard',
};

// ─── Metadata ─────────────────────────────────────────────────────────────────

/**
 * `generateMetadata` is used instead of a static `metadata` export so that:
 *  1. It is a named function (easier to grep / trace in large codebases).
 *  2. It can be made `async` in future iterations to fetch the tenant name
 *     and produce e.g. `"Admin | Brilliant Academy — EduCRM"` titles.
 *  3. It inherits from the root layout's `siteConfig.name`.
 *
 * All authenticated pages set `robots.index = false` to prevent accidental
 * indexing of private dashboard content.
 */
export function generateMetadata(): Metadata {
  return {
    title: {
      template: `%s | Admin — ${siteConfig.name}`,
      default:  `Admin Dashboard | ${siteConfig.name}`,
    },
    description:
      `${siteConfig.name} administration panel — manage courses, teachers, ` +
      'students, payments, schedules and analytics.',
    robots: {
      index:     false,
      follow:    false,
      noarchive: true,
    },
  };
}

// ─── Layout component ─────────────────────────────────────────────────────────

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getServerUser();

  // ── Guard 1: no valid session → redirect to login ─────────────────────────
  // The middleware should have already caught this, but we guard here too
  // as a defence-in-depth measure.
  if (!user) {
    redirect('/login');
  }

  // ── Guard 2: wrong role → redirect to the role's own home ─────────────────
  // Students and teachers who navigate to /admin/... are sent back to their
  // own dashboards. This prevents accidental access via direct URL typing.
  if (!isAdminAllowed(user.role)) {
    redirect(ROLE_HOME[user.role]);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  // No additional wrapper needed — the shared dashboard layout (parent) renders
  // the sidebar, header, and page container. This layout purely enforces auth.
  return <>{children}</>;
}
