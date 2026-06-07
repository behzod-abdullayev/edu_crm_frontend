/**
 * src/app/[locale]/(dashboard)/owner/settings/page.tsx
 *
 * FIX: Owner settings page was missing (404). The owner layout only has
 *      /owner/system for system settings. This page redirects there.
 *      If the sidebar ever links to /owner/settings, users will land on /owner/system.
 */

import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function OwnerSettingsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Redirect to the system config page which contains all owner settings
  redirect(`/${locale}/owner/system`);
}
