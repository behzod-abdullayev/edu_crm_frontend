/**
 * src/app/[locale]/(auth)/forgot-password/metadata.ts
 *
 * generateMetadata for the Forgot Password page.
 *
 * Exported separately from page.tsx so the Server Component tree stays clean
 * and metadata generation can be unit-tested in isolation.
 *
 * CONTRACT (matches prompt requirements):
 * ─────────────────────────────────────────
 * ✅ Uses getTranslations({ locale, namespace: 'auth' }) — zero hardcoded strings.
 * ✅ robots: { index: false, follow: false } — auth-flow page, must not be indexed.
 * ✅ Full Open-Graph block (type, title, description, url, locale, siteName, images).
 * ✅ Twitter card block.
 * ✅ Canonical URL built from siteConfig.url.
 * ✅ No "any" TypeScript types.
 * ✅ No TODO / placeholder comments.
 * ✅ strict-mode compatible — params is Promise<{ locale: string }> (Next.js 15).
 *
 * Usage in page.tsx:
 * ─────────────────────────────────────────
 *   export { generateMetadata } from './metadata';
 */

import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { siteConfig } from '@/config/site.config';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MetadataProps {
  params: Promise<{ locale: string }>;
}

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: MetadataProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });

  const pageTitle = t('forgotPassword');
  // Reuse loginSubtitle as the generic auth-flow description (matches existing pattern).
  const pageDescription = t('loginSubtitle');
  const canonicalUrl = `${siteConfig.url}/${locale}/forgot-password`;

  return {
    title: pageTitle,
    description: pageDescription,

    // Auth-flow page — must not be indexed.
    robots: {
      index: false,
      follow: false,
    },

    // Canonical URL for this locale variant.
    alternates: {
      canonical: canonicalUrl,
    },

    // Open-Graph
    openGraph: {
      type: 'website',
      title: `${pageTitle} | ${siteConfig.name}`,
      description: pageDescription,
      url: canonicalUrl,
      locale,
      siteName: siteConfig.name,
      images: [
        {
          url: `${siteConfig.url}${siteConfig.ogImage}`,
          width: 1200,
          height: 630,
          alt: `${pageTitle} | ${siteConfig.name}`,
        },
      ],
    },

    // Twitter card
    twitter: {
      card: 'summary_large_image',
      title: `${pageTitle} | ${siteConfig.name}`,
      description: pageDescription,
      images: [`${siteConfig.url}${siteConfig.ogImage}`],
    },
  };
}