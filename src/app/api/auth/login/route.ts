import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4001';
const COOKIE_NAME = process.env['NEXT_PUBLIC_AUTH_COOKIE_NAME'] ?? 'auth_token';
const REFRESH_COOKIE_NAME = process.env['NEXT_PUBLIC_REFRESH_COOKIE_NAME'] ?? 'refresh_token';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    let backendRes: Response;
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email: body.email, password: body.password }),
      });
    } catch (fetchErr: unknown) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      console.error('[API /auth/login] Cannot reach backend:', msg);
      return NextResponse.json(
        { message: `Backend ulanmadi (${BACKEND_URL}): ${msg}` },
        { status: 502 },
      );
    }

    let data: Record<string, unknown>;
    try {
      data = await backendRes.json();
    } catch {
      console.error('[API /auth/login] Backend non-JSON response, status:', backendRes.status);
      return NextResponse.json(
        { message: `Backend noto'g'ri javob qaytardi (status: ${backendRes.status})` },
        { status: 502 },
      );
    }

    if (!backendRes.ok) {
      const msg = typeof data?.['message'] === 'string' ? data['message'] : 'Invalid credentials';
      return NextResponse.json({ message: msg }, { status: backendRes.status });
    }

    const accessToken = data['accessToken'] as string;
    const refreshToken = data['refreshToken'] as string;
    const user = data['user'] as { role: string; [key: string]: unknown };

    if (!accessToken || !user) {
      console.error('[API /auth/login] Backend response missing accessToken or user:', data);
      return NextResponse.json(
        { message: 'Backend noto\'g\'ri format qaytardi' },
        { status: 502 },
      );
    }

    const rememberMe = Boolean(body.rememberMe);
    const maxAge = rememberMe ? 60 * 60 * 24 * 7 : undefined;

    const response = NextResponse.json({ user, token: accessToken }, { status: 200 });

    response.cookies.set(COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      sameSite: 'lax',
      path: '/',
      ...(maxAge !== undefined ? { maxAge } : {}),
    });

    if (refreshToken) {
      response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
        httpOnly: true,
        secure: process.env['NODE_ENV'] === 'production',
        sameSite: 'lax',
        path: '/',
        ...(maxAge !== undefined ? { maxAge: maxAge * 2 } : {}),
      });
    }

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[API /auth/login] Unexpected error:', msg);
    return NextResponse.json({ message: `Server xatosi: ${msg}` }, { status: 500 });
  }
}