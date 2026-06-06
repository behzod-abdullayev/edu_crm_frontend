import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4001';
const COOKIE_NAME = process.env['NEXT_PUBLIC_AUTH_COOKIE_NAME'] ?? 'auth_token';

/**
 * GET /api/auth/me
 *
 * Next.js proxy — backendga to'g'ridan murojaat qilish CSP tomonidan
 * bloklanadi (http://localhost:4001 ruxsatsiz). Bu route HTTP-only
 * cookie dagi auth_token ni o'qib, backendga server-side so'rov yuboradi.
 *
 * Browser → /api/auth/me (self, CSP ruxsatli)
 *         → backend /api/v1/auth/me (server-side, CSP ta'sir qilmaydi)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    let backendRes: Response;
    try {
      backendRes = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
    } catch (fetchErr: unknown) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      console.error('[API /auth/me] Cannot reach backend:', msg);
      return NextResponse.json(
        { message: `Backend ulanmadi: ${msg}` },
        { status: 502 },
      );
    }

    let data: unknown;
    try {
      data = await backendRes.json();
    } catch {
      return NextResponse.json(
        { message: `Backend noto'g'ri javob (status: ${backendRes.status})` },
        { status: 502 },
      );
    }

    if (!backendRes.ok) {
      return NextResponse.json(data, { status: backendRes.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[API /auth/me] Unexpected error:', msg);
    return NextResponse.json({ message: `Server xatosi: ${msg}` }, { status: 500 });
  }
}