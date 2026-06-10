'use client';

import { useEffect } from 'react';
// ✅ FIX 2: AbstractIntlMessages type allaqachon bor, faqat NextIntlClientProvider ga timeZone beramiz
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { ThemeProvider } from './ThemeProvider';
import { QueryProvider } from './QueryProvider';
import { ToastProvider } from './ToastProvider';
import { SocketProvider } from './SocketProvider';
import { useAuthStore } from '@/store/auth.store';
import { useTenantStore } from '@/store/tenant.store';

interface AppProvidersProps {
  children: React.ReactNode;
  locale: string;
  messages?: AbstractIntlMessages;
  // ✅ FIX 2: timeZone prop qo'shildi — ENVIRONMENT_FALLBACK xatosini bartaraf etadi
  timeZone?: string;
}

function TenantLoader(): null {
  const loadTenant = useTenantStore((s) => s.loadTenant);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const host = window.location.hostname;
    const parts = host.split('.');
    const slug = parts.length >= 3 ? parts[0] : null;

    if (slug && slug !== 'www' && slug !== 'app') {
      loadTenant(slug);
    }
  }, [loadTenant]);

  return null;
}

function AuthHydrator(): null {
  const syncMe = useAuthStore((s) => s.syncMe);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (accessToken) {
      syncMe();
    }
  }, [accessToken, syncMe]);

  return null;
}

/**
 * Keeps `localStorage.NEXT_LOCALE` in sync with the active next-intl locale.
 * The axios instance reads this value to set the `Accept-Language` header,
 * which was previously always 'en' since nothing ever wrote this key.
 */
function LocaleSync({ locale }: { locale: string }): null {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('NEXT_LOCALE', locale);
    }
  }, [locale]);

  return null;
}

export function AppProviders({
  children,
  locale,
  messages,
  // ✅ FIX 2: default qiymat — layout.tsx dan timeZone kelmasa ham xato bo'lmaydi
  timeZone = 'Asia/Tashkent',
}: AppProvidersProps) {
  return (
    // ✅ FIX 2: messages prop uzatildi (bo'sh {} o'rniga real tarjimalar)
    //           timeZone prop qo'shildi (ENVIRONMENT_FALLBACK ni bartaraf etadi)
    <NextIntlClientProvider
      locale={locale}
      messages={messages ?? {}}
      timeZone={timeZone}
    >
      <ThemeProvider>
        <QueryProvider>
          <ToastProvider>
            <SocketProvider>
              <TenantLoader />
              <AuthHydrator />
              <LocaleSync locale={locale} />
              {children}
            </SocketProvider>
          </ToastProvider>
        </QueryProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}