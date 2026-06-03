import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4001';
const COOKIE_NAME = process.env['NEXT_PUBLIC_AUTH_COOKIE_NAME'] ?? 'auth_token';
const REFRESH_COOKIE_NAME = process.env['NEXT_PUBLIC_REFRESH_COOKIE_NAME'] ?? 'refresh_token';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Try to call backend logout (best effort)
  if (token) {
    try {
      await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    } catch {
      // ignore backend errors on logout
    }
  }

  const response = NextResponse.json({ success: true }, { status: 200 });

  // Clear cookies
  response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' });
  response.cookies.set(REFRESH_COOKIE_NAME, '', { maxAge: 0, path: '/' });

  return response;
}