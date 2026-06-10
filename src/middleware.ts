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

  // FIX XATO 15: super_admin rolePrefixes va defaultRoutes ga qo'shildi.
  //
  // Avvalgi versiya (NOTO'G'RI):
  //   const rolePrefixes = { student, teacher, admin, owner }
  //   const defaultRoutes = { student, teacher, admin, owner }
  //   — super_admin yo'q edi → allowedPrefix = undefined → defaultRoute = undefined
  //   → super@gmail.com login bo'lsa middleware redirect qila olmasdi
  //   → sahifa yuklanmasdi yoki noto'g'ri xulosa chiqardi
  //
  // Yangi versiya (TO'G'RI):
  //   super_admin → /owner prefix va /owner/dashboard ga yo'naltiriladi
  //   Bu mantiqan to'g'ri: super_admin owner panel huquqlariga ega
  const rolePrefixes: Record<string, string> = {
    student:     '/student',
    teacher:     '/teacher',
    admin:       '/admin',
    owner:       '/owner',
    super_admin: '/owner',   // ← FIX XATO 15: qo'shildi
  };

  const defaultRoutes: Record<string, string> = {
    student:     '/student/dashboard',
    teacher:     '/teacher/dashboard',
    admin:       '/admin/dashboard',
    owner:       '/owner/dashboard',
    super_admin: '/owner/dashboard', // ← FIX XATO 15: qo'shildi
  };

  const allowedPrefix = rolePrefixes[role];
  const defaultRoute  = defaultRoutes[role];

  if (pathWithoutLocale === '/' || pathWithoutLocale === '') {
    if (defaultRoute) {
      const locale = pathname.match(/^\/(uz|en|ru)/)?.[1] ?? i18nConfig.defaultLocale;
      return NextResponse.redirect(new URL(`/${locale}${defaultRoute}`, request.url));
    }
  }

  if (allowedPrefix && !pathWithoutLocale.startsWith(allowedPrefix)) {
    // owner va super_admin — /owner/* va barcha boshqa yo'llar uchun ruxsat
    if (role === 'owner' || role === 'super_admin') {
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
    /*
     * Quyidagilarni OLIB TASHLAYMIZ (middleware ishlamaydi):
     *  - _next/static  (Next.js static assets)
     *  - _next/image   (Next.js image optimization)
     *  - favicon.ico, robots.txt, sitemap.xml
     *  - manifest.json (PWA manifest — middleware uni HTTPS ga redirect qilmasligi kerak)
     *  - Barcha rasm, font, audio, video fayllar
     *  - api/ (API routes — yuqorida alohida handle qilingan)
     *
     * Bu pattern ERR_SSL_PROTOCOL_ERROR xatosini hal qiladi:
     * manifest.json middleware orqali o'tsa va upgrade-insecure-requests bo'lsa,
     * browser uni HTTPS ga o'tkazishga urinadi — localhost da bu muvaffaqiyatsiz.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|woff2?|ttf|eot|mp4|mp3|pdf)|api/).*)',
  ],
};
