import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { siteConfig } from '@/config/site.config';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });

  return {
    title: t('resetPassword'),
    description: t('loginSubtitle'),
    robots: { index: false, follow: false },
    openGraph: {
      title: `${t('resetPassword')} | ${siteConfig.name}`,
      description: t('loginSubtitle'),
      type: 'website',
      locale,
      url: `${siteConfig.url}/${locale}/reset-password`,
      siteName: siteConfig.name,
    },
  };
}
