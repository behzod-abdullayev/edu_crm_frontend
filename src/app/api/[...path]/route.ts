import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4001';

function extractTenantIdFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as Record<string, unknown>;
    return typeof decoded['tenantId'] === 'string' ? decoded['tenantId'] : null;
  } catch {
    return null;
  }
}

async function handler(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const backendPath = path.join('/');
  const search = request.nextUrl.search;
  const url = `${BACKEND_URL}/api/v1/${backendPath}${search}`;

  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    const tenantId = extractTenantIdFromToken(token);
    if (tenantId) headers['X-Tenant-ID'] = tenantId;
  }

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const body = hasBody ? await request.text().catch(() => null) : null;

  try {
    const backendRes = await fetch(url, {
      method: request.method,
      headers,
      ...(body !== null ? { body } : {}),
    });

    const data = await backendRes.text();
    return new NextResponse(data, {
      status: backendRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ message: `Proxy error: ${msg}` }, { status: 502 });
  }
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;