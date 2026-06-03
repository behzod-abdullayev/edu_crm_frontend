import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { i18nConfig } from './config/i18n.config';

const COOKIE_NAME = process.env['NEXT_PUBLIC_AUTH_COOKIE_NAME'] ?? 'auth_token';

const PUBLIC_PATH_SEGMENTS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/api/health',
] as const;

function extractRoleFromToken(token: string): string | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (!payload) return null;
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded) as Record<string, unknown>;
    const role = parsed['role'];
    if (typeof role === 'string') return role;
    return null;
  } catch {
    return null;
  }
}

const intlMiddleware = createMiddleware({
  locales:       i18nConfig.locales,
  defaultLocale: i18nConfig.defaultLocale,
  localePrefix:  i18nConfig.localePrefix,
});

export default function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // API routelarni middleware dan o'tkazma — to'g'ridan-to'g'ri Next.js ga ber
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Strip locale prefix for route matching (e.g. /uz/login → /login)
  const pathWithoutLocale = pathname.replace(/^\/(uz|en|ru)/, '') || '/';

  // Always allow static files and health checks
  const isPublicPath = PUBLIC_PATH_SEGMENTS.some(
    (segment) => pathWithoutLocale === segment || pathWithoutLocale.startsWith(segment + '/')
  );

  if (isPublicPath) {
    return intlMiddleware(request);
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;

  // No token → redirect to /login
  if (!token) {
    const loginUrl = new URL(
      `/${i18nConfig.defaultLocale}/login`,
      request.url
    );
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = extractRoleFromToken(token);

  // Invalid token → redirect to login
  if (!role) {
    const loginUrl = new URL(`/${i18nConfig.defaultLocale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  const rolePrefixes: Record<string, string> = {
    student: '/student',
    teacher: '/teacher',
    admin:   '/admin',
    owner:   '/owner',
  };

  const defaultRoutes: Record<string, string> = {
    student: '/student/dashboard',
    teacher: '/teacher/dashboard',
    admin:   '/admin/dashboard',
    owner:   '/owner/dashboard',
  };

  const allowedPrefix  = rolePrefixes[role];
  const defaultRoute   = defaultRoutes[role];

  if (pathWithoutLocale === '/' || pathWithoutLocale === '') {
    if (defaultRoute) {
      const locale = pathname.match(/^\/(uz|en|ru)/)?.[1] ?? i18nConfig.defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}${defaultRoute}`, request.url));
    }
  }

  if (allowedPrefix && !pathWithoutLocale.startsWith(allowedPrefix)) {
    if (role === 'owner') {
      return intlMiddleware(request);
    }
    const locale = pathname.match(/^\/(uz|en|ru)/)?.[1] ?? i18nConfig.defaultLocale;
    return NextResponse.redirect(
      new URL(`/${locale}${defaultRoute ?? '/login'}`, request.url)
    );
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot)|api/).*)',
  ],
};