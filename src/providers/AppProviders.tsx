'use client';

import { useEffect } from 'react';
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
}

function TenantLoader(): null {
  const loadTenant = useTenantStore((s) => s.loadTenant);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Derive slug from subdomain: e.g. myschool.educrm.io → 'myschool'
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

export function AppProviders({ children, locale, messages }: AppProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages ?? {}}>
      <ThemeProvider>
        <QueryProvider>
          <ToastProvider>
            <SocketProvider>
              <TenantLoader />
              <AuthHydrator />
              {children}
            </SocketProvider>
          </ToastProvider>
        </QueryProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
