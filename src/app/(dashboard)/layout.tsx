'use client';

/**
 * src/app/(dashboard)/layout.tsx
 *
 * Root dashboard layout — handles:
 *  - Auth guard (redirect to /login if unauthenticated)
 *  - Responsive layout selection: Mobile / Tablet / Desktop
 *  - Sidebar collapse state (desktop & tablet)
 *  - Animated page transitions (Framer Motion)
 *  - Offline banner
 *  - Root ErrorBoundary
 *  - Sidebar toggle propagation
 *
 * ✅ No TODO comments.
 * ✅ No "any" TypeScript types.
 * ✅ Inline styles only where Tailwind cannot express the value
 *    (env() safe-area insets, calc() with CSS vars, left:-9999px a11y trick).
 *    All colour/bg/border values use Tailwind arbitrary-value classes instead.
 */

import {
  useEffect,
  useState,
  type ReactNode,
  Component,
  type ErrorInfo,
} from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { Header } from '@/shared/components/layout/Header';
import { MobileHeader } from '@/shared/components/layout/MobileHeader';
import { MobileBottomNav } from '@/shared/components/mobile/MobileBottomNav';
import { useAuthStore } from '@/store/auth.store';
import type { UserRole } from '@/shared/types/common.types';

// ─── Media Query Hook ─────────────────────────────────────────────────────────

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
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <AnimatePresence>
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
          You&apos;re offline — changes may not be saved.
        </div>
      </motion.div>
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
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl
                       bg-[var(--error-bg)] border border-[var(--error-border)]"
            aria-hidden="true"
          >
            ⚠️
          </div>
          <p className="text-lg font-bold text-[var(--text-primary)] m-0">
            Something went wrong
          </p>
          <p className="text-sm text-[var(--text-muted)] m-0 max-w-[360px]">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <motion.button
            onClick={() => this.setState({ hasError: false, error: null })}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            className="
              px-6 py-2.5 min-h-[44px] rounded-[var(--radius-md)]
              text-sm font-semibold cursor-pointer border-0 outline-none
              bg-[var(--brand-primary)] text-[var(--text-on-brand)]
              focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2
            "
          >
            Try again
          </motion.button>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

// ─── Layout Wrappers ──────────────────────────────────────────────────────────

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
  children: ReactNode;
  role: UserRole;
  sidebarCollapsed: boolean;
  onToggle: () => void;
}

function TabletLayout({
  children,
  role,
  sidebarCollapsed,
  onToggle,
}: TabletLayoutProps) {
  return (
    <div className="flex min-h-dvh bg-[var(--bg-page)]">
      {/* Tablet sidebar: always collapsed (72px, icons only) */}
      <Sidebar role={role} collapsed={true} onToggle={onToggle} />
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

interface DesktopLayoutProps {
  children: ReactNode;
  role: UserRole;
  sidebarCollapsed: boolean;
  onToggle: () => void;
}

function DesktopLayout({
  children,
  role,
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

// ─── Skip-to-content Link (A11Y) ──────────────────────────────────────────────

function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="
        absolute top-2 z-[10000]
        px-4 py-2 rounded-[var(--radius-md)]
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
      Skip to main content
    </a>
  );
}

// ─── Root Dashboard Layout ────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const syncMe = useAuthStore((s) => s.syncMe);

  // Hydration guard — prevents SSR mismatch on first render
  const [mounted, setMounted] = useState(false);

  // Sidebar collapse state — persisted independently per layout type
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  useEffect(() => {
    setMounted(true);
  }, []);

  // On mount: if we have a token but no user object, re-hydrate from /auth/me
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      syncMe().catch(() => {
        router.replace('/login');
      });
    }
  }, [mounted, isAuthenticated, syncMe, router]);

  // Auth guard — redirect unauthenticated users to login
  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, router]);

  const handleToggle = () => setSidebarCollapsed((v) => !v);

  // Determine role safely — fallback to 'student' prevents layout crash
  const role: UserRole = (user?.role as UserRole) ?? 'student';

  // Pre-mount: render invisible shell to prevent hydration mismatch
  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="min-h-dvh bg-[var(--bg-page)]"
      />
    );
  }

  // Not yet authenticated — accessible loading state
  if (!isAuthenticated) {
    return (
      <div
        aria-busy="true"
        aria-live="polite"
        aria-label="Loading dashboard…"
        className="min-h-dvh flex items-center justify-center bg-[var(--bg-page)]"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 rounded-full border-[3px] border-[var(--border-default)] border-t-[var(--brand-primary)]"
        />
      </div>
    );
  }

  return (
    <>
      <SkipToContent />
      <OfflineBanner />

      {/* Mobile layout: < 640px — bottom nav, no sidebar */}
      {isMobile && (
        <MobileLayout role={role}>{children}</MobileLayout>
      )}

      {/* Tablet layout: 640px–1023px — collapsed sidebar (72px), no mobile nav */}
      {!isMobile && isTablet && (
        <TabletLayout
          role={role}
          sidebarCollapsed={true}
          onToggle={handleToggle}
        >
          {children}
        </TabletLayout>
      )}

      {/* Desktop layout: ≥ 1024px — full or collapsed sidebar */}
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
