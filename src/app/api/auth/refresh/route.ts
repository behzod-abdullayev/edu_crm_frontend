/**
 * POST /api/auth/refresh
 *
 * HTTP-only cookie orqali token yangilash.
 * LoginClient.tsx endi cookie-based autentifikatsiya ishlatadi,
 * shuning uchun refresh ham cookie orqali ishlashi kerak.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4001';
const COOKIE_NAME = process.env['NEXT_PUBLIC_AUTH_COOKIE_NAME'] ?? 'auth_token';
const REFRESH_COOKIE_NAME = process.env['NEXT_PUBLIC_REFRESH_COOKIE_NAME'] ?? 'refresh_token';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { message: 'Refresh token topilmadi' },
      { status: 401 },
    );
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (fetchErr: unknown) {
    const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    return NextResponse.json(
      { message: `Backend ulanmadi: ${msg}` },
      { status: 502 },
    );
  }

  if (!backendRes.ok) {
    // Refresh token muddati o'tgan — cookilarni tozalaymiz
    const response = NextResponse.json(
      { message: 'Refresh token yaroqsiz yoki muddati o\'tgan' },
      { status: 401 },
    );
    response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
    response.cookies.set(REFRESH_COOKIE_NAME, '', { maxAge: 0, path: '/' });
    return response;
  }

  const data = await backendRes.json() as {
    accessToken: string;
    refreshToken?: string;
    user?: unknown;
  };

  const response = NextResponse.json(
    { accessToken: data.accessToken },
    { status: 200 },
  );

  // Yangi access token ni cookie ga yozamiz
  response.cookies.set(COOKIE_NAME, data.accessToken, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'lax',
    path: '/',
  });

  // Agar backend yangi refresh token qaytarsa, uni ham cookie ga yozamiz
  if (data.refreshToken) {
    response.cookies.set(REFRESH_COOKIE_NAME, data.refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}