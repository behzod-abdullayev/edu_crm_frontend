/**
 * GET /api/health
 *
 * Edge-compatible health check endpoint.
 * Used by:
 *  - Docker HEALTHCHECK
 *  - Kubernetes liveness / readiness probes
 *  - Uptime monitoring services
 *  - CI/CD pre-deploy smoke tests
 *
 * Response shape is intentionally minimal and consistent.
 * All fields are always present — consumers can rely on the schema.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// ─── Response type ─────────────────────────────────────────────────────────────

interface HealthResponse {
  /** Always "ok" — signals the frontend process is running */
  status: 'ok';
  /** ISO-8601 timestamp at time of request */
  timestamp: string;
  /** Package version from npm_package_version env injected by Node/Next */
  version: string;
  /** Build identifier injected at build time via NEXT_PUBLIC_BUILD_ID */
  buildId: string;
  /** Deployment environment */
  env: string;
  /** Human-readable uptime of the edge function (not process uptime on edge) */
  runtime: 'edge';
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export function GET(_request: NextRequest): NextResponse<HealthResponse> {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env['npm_package_version'] ?? '1.0.0',
    buildId: process.env['NEXT_PUBLIC_BUILD_ID'] ?? 'local',
    env: process.env['NODE_ENV'] ?? 'development',
    runtime: 'edge',
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      // Prevent health check responses from being cached anywhere
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'CDN-Cache-Control': 'no-store',
      'Surrogate-Control': 'no-store',
      // CORS: allow monitoring services on any origin
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    },
  });
}

// Allow HEAD requests for lightweight uptime checks
export function HEAD(_request: NextRequest): NextResponse {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// Allow OPTIONS for CORS preflight from monitoring services
export function OPTIONS(_request: NextRequest): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Max-Age': '86400',
    },
  });
}
