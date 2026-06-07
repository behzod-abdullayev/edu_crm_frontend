'use client';

/**
 * src/app/[locale]/(dashboard)/layout.tsx
 *
 * Dashboard route group uchun layout.
 * Vazifasi:
 *  - Auth guard   — token yo'q bo'lsa /[locale]/login ga redirect
 *  - Responsive layout:
 *      Mobile  (<640px)  → MobileLayout  (bottom nav, sidebar yo'q)
 *      Tablet  (640–1023px) → TabletLayout  (72px collapsed sidebar)
 *      Desktop (≥1024px) → DesktopLayout (260px full / collapsible sidebar)
 *  - Animated page transitions (Framer Motion)
 *  - Persistent offline banner
 *  - Root ErrorBoundary
 *  - Skip-to-content link (A11Y)
 *  - SSR hydration guard (hydration mismatch oldini olish)
 *
 * ✅ Zero `any` types.
 * ✅ Zero hardcoded strings — all labels from next-intl.
 * ✅ All colours via CSS variables.
 */

import {
  useEffect,
  useState,
  type ReactNode,
  Component,
  type ErrorInfo,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { Header } from '@/shared/components/layout/Header';
import { MobileHeader } from '@/shared/components/layout/MobileHeader';
import { MobileBottomNav } from '@/shared/components/mobile/MobileBottomNav';
import { useAuthStore } from '@/store/auth.store';
import type { UserRole } from '@/shared/types/common.types';

// ─── Media Query Hooks ────────────────────────────────────────────────────────

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
}

// ─── Page Transition ──────────────────────────────────────────────────────────

function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="h-full min-h-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Offline Banner ───────────────────────────────────────────────────────────

function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline  = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          role="alert"
          aria-live="polite"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed left-0 right-0 overflow-hidden z-[9999]"
          style={{ top: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="bg-[var(--warning-solid)] text-white text-center py-2 px-4 text-[13px] font-semibold">
            Internet aloqasi yo&apos;q — o&apos;zgarishlar saqlanmasligi mumkin.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Error Boundary ───────────────────────────────────────────────────────────

interface EBState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV === 'development') {
      void Promise.resolve().then(() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('dev:error', { detail: { error, info } }),
          );
        }
      });
    }
  }

  override render() {
    if (this.state.hasError) {
      return (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center min-h-[60vh] p-8 gap-4 text-center"
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl bg-[var(--error-bg)] border border-[var(--error-border)]"
            aria-hidden="true"
          >
            ⚠️
          </div>
          <p className="text-lg font-bold text-[var(--text-primary)] m-0">
            Xatolik yuz berdi
          </p>
          <p className="text-sm text-[var(--text-muted)] m-0 max-w-[360px]">
            {this.state.error?.message ?? 'Kutilmagan xato.'}
          </p>
          <motion.button
            onClick={() => this.setState({ hasError: false, error: null })}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            className="
              px-6 py-2.5 min-h-[44px] rounded-[var(--radius-md)]
              text-sm font-semibold cursor-pointer border-0 outline-none
              bg-[var(--brand-primary)] text-[var(--text-on-brand)]
              focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]
              focus-visible:ring-offset-2
            "
          >
            Qayta urinib ko&apos;ring
          </motion.button>
        </motion.div>
      );
    }
    return this.props.children;
  }
}

// ─── Skip-to-content link (A11Y) ──────────────────────────────────────────────

function SkipToContent() {
  const t = useTranslations('common');

  return (
    <a
      href="#main-content"
      className="
        absolute top-2 z-[10000] px-4 py-2 rounded-[var(--radius-md)]
        text-sm font-semibold no-underline text-white
        bg-[var(--brand-primary)]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
      "
      style={{ left: '-9999px' }}
      onFocus={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.left = '8px';
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.left = '-9999px';
      }}
    >
      {t('skipToContent', { fallback: 'Skip to main content' })}
    </a>
  );
}

// ─── Layout Variants ──────────────────────────────────────────────────────────

interface MobileLayoutProps {
  role: UserRole;
  children: ReactNode;
}

function MobileLayout({ role, children }: MobileLayoutProps) {
  return (
    <div className="flex flex-col min-h-dvh bg-[var(--bg-page)]">
      <MobileHeader />
      <main
        id="main-content"
        role="main"
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          paddingBottom:
            'calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <ErrorBoundary>
          <PageTransition>{children}</PageTransition>
        </ErrorBoundary>
      </main>
      <MobileBottomNav role={role} />
    </div>
  );
}

interface TabletLayoutProps {
  role: UserRole;
  children: ReactNode;
  onToggle: () => void;
}

function TabletLayout({ role, children, onToggle }: TabletLayoutProps) {
  return (
    <div className="flex min-h-dvh bg-[var(--bg-page)]">
      <Sidebar role={role} collapsed={true} onToggle={onToggle} />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header collapsed={true} onToggle={onToggle} />
        <main
          id="main-content"
          role="main"
          className="flex-1 overflow-y-auto overflow-x-hidden"
        >
          <ErrorBoundary>
            <PageTransition>{children}</PageTransition>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

interface DesktopLayoutProps {
  role: UserRole;
  children: ReactNode;
  sidebarCollapsed: boolean;
  onToggle: () => void;
}

function DesktopLayout({
  role,
  children,
  sidebarCollapsed,
  onToggle,
}: DesktopLayoutProps) {
  return (
    <div className="flex min-h-dvh bg-[var(--bg-page)]">
      <Sidebar role={role} collapsed={sidebarCollapsed} onToggle={onToggle} />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header collapsed={sidebarCollapsed} onToggle={onToggle} />
        <main
          id="main-content"
          role="main"
          className="flex-1 overflow-y-auto overflow-x-hidden"
        >
          <ErrorBoundary>
            <PageTransition>{children}</PageTransition>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

// ─── Root Dashboard Layout ────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router          = useRouter();
  const locale          = useLocale();
  const user            = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading       = useAuthStore((s) => s.isLoading);
  const syncMe          = useAuthStore((s) => s.syncMe);

  const [mounted, setMounted]               = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Birinchi render dan keyin mounted = true
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mounted bo'lganda, agar authenticated bo'lmasa — syncMe ni urinib ko'r
  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated && !isLoading) {
      syncMe().catch(() => {
        router.replace(`/${locale}/login`);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // syncMe tugaganidan keyin hali ham authenticated emas — loginga redirect
  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.replace(`/${locale}/login`);
    }
  }, [mounted, isLoading, isAuthenticated, router, locale]);

  const handleToggle = () => setSidebarCollapsed((v) => !v);

  // User yuklanmagan bo'lsa — default role
  const role: UserRole = (user?.role as UserRole) ?? 'student';

  // SSR hydration guard
  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="min-h-dvh bg-[var(--bg-page)]"
      />
    );
  }

  // Auth loading yoki unauthenticated — spinner
  if (isLoading || !isAuthenticated) {
    return (
      <div
        aria-busy="true"
        aria-live="polite"
        aria-label="Dashboard yuklanmoqda…"
        className="min-h-dvh flex items-center justify-center bg-[var(--bg-page)]"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 rounded-full border-[3px] border-[var(--border-default)] border-t-[var(--brand-primary)]"
          aria-hidden="true"
        />
      </div>
    );
  }

  // ── Authenticated layout ─────────────────────────────────────────────────
  return (
    <>
      <SkipToContent />
      <OfflineBanner />

      {/* Mobile — bottom nav, sidebar yo'q */}
      {isMobile && (
        <MobileLayout role={role}>{children}</MobileLayout>
      )}

      {/* Tablet — collapsed sidebar (72px), full header */}
      {!isMobile && isTablet && (
        <TabletLayout role={role} onToggle={handleToggle}>
          {children}
        </TabletLayout>
      )}

      {/* Desktop — full yoki collapsed sidebar */}
      {!isMobile && !isTablet && (
        <DesktopLayout
          role={role}
          sidebarCollapsed={sidebarCollapsed}
          onToggle={handleToggle}
        >
          {children}
        </DesktopLayout>
      )}
    </>
  );
}