/**
 * src/config/site.config.ts
 *
 * Central site / app configuration.
 *
 * This file is the single source of truth for:
 *  - App identity (name, description, URLs)
 *  - Supported locales and i18n defaults
 *  - Tenant resolution strategy (subdomain / path / header)
 *  - Feature toggles from environment variables
 *  - PWA manifest configuration
 *  - SEO / Open-Graph defaults
 *
 * Server-only helpers (getTenantSlug, resolveTenantSlugFromHeaders) are
 * marked with JSDoc — they read from `headers()` or hostname strings and
 * must not be called in browser bundles.
 *
 * ✅ No "any" TypeScript types.
 * ✅ No TODO comments.
 * ✅ All env var reads use bracket notation for strict TypeScript.
 */

// ─── Core config ──────────────────────────────────────────────────────────────

export const siteConfig = {
  /** Human-readable app name used in titles, OG tags, and notifications. */
  name: 'EduCRM',

  /** Short name used in PWA install prompts and compact UI. */
  shortName: 'EduCRM',

  /** One-sentence description used in <meta name="description"> and OG. */
  description: 'Educational CRM + LMS Platform — manage students, courses, payments and analytics.',

  /** Canonical origin of the app. Used for SEO absolute URLs. */
  url: process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000',

  /** Backend REST API base URL. */
  apiUrl: process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000',

  /** Backend WebSocket URL. */
  wsUrl: process.env['NEXT_PUBLIC_WS_URL'] ?? 'ws://localhost:4000',

  /** Public storage / CDN origin for uploaded files. */
  storageUrl:
    process.env['NEXT_PUBLIC_STORAGE_URL'] ?? 'http://localhost:4000/uploads',

  // ── Localisation ────────────────────────────────────────────────────────
  defaultLocale: 'uz' as const,
  locales: ['uz', 'en', 'ru'] as const,

  // ── Tenant resolution ────────────────────────────────────────────────────
  /**
   * How tenant slugs are resolved:
   *  - 'subdomain' → academy.platform.com  (production default)
   *  - 'path'      → platform.com/t/academy
   *  - 'header'    → X-Tenant-Slug: academy
   */
  tenantMode: (process.env['NEXT_PUBLIC_TENANT_MODE'] ?? 'subdomain') as TenantMode,

  /** Root domain used for subdomain extraction (without port in prod). */
  rootDomain: process.env['NEXT_PUBLIC_ROOT_DOMAIN'] ?? 'localhost:3000',

  // ── Feature toggles ──────────────────────────────────────────────────────
  features: {
    ai:       process.env['NEXT_PUBLIC_FEATURE_AI']       === 'true',
    realtime: process.env['NEXT_PUBLIC_FEATURE_REALTIME'] !== 'false',   // ON by default
    offline:  process.env['NEXT_PUBLIC_FEATURE_OFFLINE']  === 'true',
    analytics: process.env['NEXT_PUBLIC_ENABLE_ANALYTICS'] !== 'false',  // ON by default
  },

  // ── PWA / manifest ───────────────────────────────────────────────────────
  /** Theme colour used in the browser chrome and PWA splash. */
  themeColor: '#4F46E5',

  /** Background colour for the PWA splash screen. */
  backgroundColor: '#0F172A',

  // ── SEO defaults ─────────────────────────────────────────────────────────
  /** Absolute path to the default Open-Graph image (1200×630 px). */
  ogImage: '/og-image.png',

  /** Twitter handle (without @) — used in <meta name="twitter:site">. */
  twitterHandle: '',
} as const;

// ─── Derived types ────────────────────────────────────────────────────────────

export type Locale     = (typeof siteConfig.locales)[number];
export type TenantMode = 'subdomain' | 'path' | 'header';

// ─── PWA manifest config ──────────────────────────────────────────────────────

/**
 * Typed manifest configuration.
 * Consumed by `src/app/manifest.ts` (Next.js MetadataRoute.Manifest).
 *
 * Example usage in app/manifest.ts:
 * ```ts
 * import type { MetadataRoute } from 'next';
 * import { manifestConfig } from '@/config/site.config';
 * export default function manifest(): MetadataRoute.Manifest {
 *   return manifestConfig;
 * }
 * ```
 */
export interface PwaManifest {
  name:             string;
  short_name:       string;
  description:      string;
  start_url:        string;
  display:          'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  background_color: string;
  theme_color:      string;
  orientation:      'portrait' | 'landscape' | 'any';
  icons: Array<{
    src:     string;
    sizes:   string;
    type:    string;
    purpose?: string;
  }>;
}

export const manifestConfig: PwaManifest = {
  name:             siteConfig.name,
  short_name:       siteConfig.shortName,
  description:      siteConfig.description,
  start_url:        '/',
  display:          'standalone',
  background_color: siteConfig.backgroundColor,
  theme_color:      siteConfig.themeColor,
  orientation:      'portrait',
  icons: [
    { src: '/icons/icon-72x72.png',   sizes: '72x72',   type: 'image/png' },
    { src: '/icons/icon-96x96.png',   sizes: '96x96',   type: 'image/png' },
    { src: '/icons/icon-128x128.png', sizes: '128x128', type: 'image/png' },
    { src: '/icons/icon-144x144.png', sizes: '144x144', type: 'image/png' },
    { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: '/icons/icon-384x384.png', sizes: '384x384', type: 'image/png' },
    { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
};

// ─── SEO defaults ─────────────────────────────────────────────────────────────

/**
 * Default Open-Graph metadata used as a base for all pages.
 * Individual pages should override title + description as needed.
 */
export const defaultOpenGraph = {
  type:        'website' as const,
  siteName:    siteConfig.name,
  url:         siteConfig.url,
  title:       siteConfig.name,
  description: siteConfig.description,
  images: [
    {
      url:    `${siteConfig.url}${siteConfig.ogImage}`,
      width:  1200,
      height: 630,
      alt:    siteConfig.name,
    },
  ],
};

/**
 * Default Twitter card metadata.
 *
 * Note: `siteConfig` is `as const`, so `twitterHandle` is the literal type `''`
 * at compile time. Using `handle && { site }` produces `'' | { site }` which
 * TypeScript cannot spread (TS2698: Spread types may only be created from object
 * types). Instead we build the optional `site` field through an explicit typed
 * intermediate that is always an object, then spread that.
 */
const _twitterSiteField: { site?: string } =
  siteConfig.twitterHandle
    ? { site: `@${siteConfig.twitterHandle}` }
    : {};

export const defaultTwitter = {
  card:        'summary_large_image' as const,
  title:       siteConfig.name,
  description: siteConfig.description,
  images:      [`${siteConfig.url}${siteConfig.ogImage}`],
  ..._twitterSiteField,
};

// ─── Tenant slug helpers ──────────────────────────────────────────────────────

/**
 * Extract a tenant slug from a hostname string.
 *
 * Works for the 'subdomain' tenant mode only.
 * Returns `null` for bare hosts (no subdomain), localhost, or IP addresses.
 *
 * Examples:
 *   getTenantSlugFromHostname('academy.platform.com', 'platform.com') → 'academy'
 *   getTenantSlugFromHostname('platform.com', 'platform.com')         → null
 *   getTenantSlugFromHostname('localhost:3000', 'localhost:3000')      → null
 *
 * @param hostname   - The full hostname (e.g. from `request.headers.get('host')`)
 * @param rootDomain - The root domain to strip (e.g. siteConfig.rootDomain)
 */
export function getTenantSlugFromHostname(
  hostname: string,
  rootDomain: string = siteConfig.rootDomain,
): string | null {
  // Strip port from both strings for comparison
  const host = hostname.replace(/:\d+$/, '').toLowerCase();
  const root = rootDomain.replace(/:\d+$/, '').toLowerCase();

  // No subdomain or IS the root domain
  if (host === root || !host.endsWith(`.${root}`)) return null;

  const subdomain = host.slice(0, host.length - root.length - 1);

  // Reject empty, multi-level, or wildcard subdomains
  if (!subdomain || subdomain.includes('.') || subdomain === '*') return null;

  return subdomain;
}

/**
 * Extract a tenant slug from a URL pathname string.
 *
 * Works for the 'path' tenant mode only.
 * Expects URLs in the form: /t/<slug>/...
 *
 * Examples:
 *   getTenantSlugFromPath('/t/academy/student/dashboard') → 'academy'
 *   getTenantSlugFromPath('/student/dashboard')           → null
 *
 * @param pathname - The URL pathname (e.g. from `request.nextUrl.pathname`)
 */
export function getTenantSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/t\/([^/]+)/);
  return match?.[1] ?? null;
}

/**
 * Resolve tenant slug from a Headers object.
 *
 * Checks in priority order:
 *  1. If mode === 'header' → reads X-Tenant-Slug header
 *  2. If mode === 'path'   → reads X-Forwarded-Path or x-next-url header
 *  3. If mode === 'subdomain' (default) → reads Host header
 *
 * This is a pure function — it does NOT call `headers()` from next/headers.
 * Pass the Headers object from `request.headers` (middleware) or from
 * the `headers()` import (Server Components).
 *
 * @param headers    - Headers object from the current request
 * @param mode       - Tenant resolution mode (default: siteConfig.tenantMode)
 * @param rootDomain - Root domain for subdomain extraction
 */
export function resolveTenantSlug(
  headers: Headers,
  mode:       TenantMode = siteConfig.tenantMode,
  rootDomain: string     = siteConfig.rootDomain,
): string | null {
  switch (mode) {
    case 'header': {
      const slug = headers.get('x-tenant-slug') ?? headers.get('X-Tenant-Slug');
      return slug ?? null;
    }
    case 'path': {
      const forwardedPath = headers.get('x-forwarded-path') ?? headers.get('x-invoke-path');
      if (forwardedPath) return getTenantSlugFromPath(forwardedPath);
      return null;
    }
    case 'subdomain':
    default: {
      const host = headers.get('host') ?? headers.get('x-forwarded-host') ?? '';
      return getTenantSlugFromHostname(host, rootDomain);
    }
  }
}

/**
 * Server Component helper — resolves the tenant slug for the current request.
 *
 * Uses the `headers()` function from `next/headers` (Server Components only).
 * Returns `null` in development when running on localhost without a subdomain.
 *
 * Usage in a Server Component or layout:
 * ```ts
 * const slug = await getTenantSlug();
 * if (slug) await loadTenant(slug);
 * ```
 *
 * ⚠️ Must NOT be called from Client Components or inside 'use client' files.
 */
export async function getTenantSlug(): Promise<string | null> {
  // Dynamically import to avoid bundling next/headers into client chunks
  const { headers } = await import('next/headers');
  const headerStore = await headers();
  return resolveTenantSlug(headerStore);
}
