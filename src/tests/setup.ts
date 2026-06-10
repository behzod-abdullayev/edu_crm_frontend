/**
 * Vitest Global Test Setup
 * Runs before every test file via vitest.config.ts → setupFiles
 *
 * Responsibilities:
 *  1. Extend Jest-DOM matchers (toBeInTheDocument, toHaveValue, etc.)
 *  2. Configure global mocks (IntersectionObserver, ResizeObserver, matchMedia,
 *     window.scrollTo, next/router, next-intl, framer-motion)
 *  3. Silence known third-party console warnings
 *  4. Clean up after every test (mock resets, DOM cleanup via RTL)
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// ─── 1. DOM cleanup after each test ──────────────────────────────────────────

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// ─── 2. IntersectionObserver ──────────────────────────────────────────────────
// Required by: useInfiniteScroll, MobileCardList, virtual scroll, PullToRefresh

const IntersectionObserverMock = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// ─── 3. ResizeObserver ────────────────────────────────────────────────────────
// Required by: Recharts ResponsiveContainer, sidebar collapse animation

const ResizeObserverMock = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// ─── 4. window.matchMedia ─────────────────────────────────────────────────────
// Required by: useMediaQuery, next-themes, Tailwind responsive hooks

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),   // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ─── 5. window.scrollTo ───────────────────────────────────────────────────────
// Required by: form submit scroll, page navigation

vi.stubGlobal('scrollTo', vi.fn());

Object.defineProperty(window, 'scroll', {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

// ─── 6. visualViewport ────────────────────────────────────────────────────────
// Required by: useVirtualKeyboard (mobile keyboard detection)

if (!window.visualViewport) {
  Object.defineProperty(window, 'visualViewport', {
    writable: true,
    configurable: true,
    value: {
      width: 1280,
      height: 800,
      scale: 1,
      offsetLeft: 0,
      offsetTop: 0,
      pageLeft: 0,
      pageTop: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    },
  });
}

// ─── 7. next/navigation mocks ─────────────────────────────────────────────────
// Required by: useRouter, useSearchParams, usePathname

vi.mock('next/navigation', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vi.importActual<typeof import('next/navigation')>('next/navigation');
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
      refresh: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
    useParams: () => ({}),
  };
});

// ─── 8. next/image mock ───────────────────────────────────────────────────────
// Required by: any component using <Image /> from 'next/image'

vi.mock('next/image', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const React = await vi.importActual<typeof import('react')>('react');
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    default: (props: Record<string, unknown>) => React.createElement('img', props as any),
  };
});

// ─── 9. next-intl mock ────────────────────────────────────────────────────────
// Returns the translation key as value so tests are locale-agnostic.

vi.mock('next-intl', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vi.importActual<typeof import('next-intl')>('next-intl');
  return {
    ...actual,
    useTranslations: (namespace?: string) =>
      (key: string, values?: Record<string, unknown>) => {
        const fullKey = namespace ? `${namespace}.${key}` : key;
        if (!values) return fullKey;
        return Object.entries(values).reduce<string>(
          (acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
          fullKey,
        );
      },
    useLocale: () => 'en',
    useFormatter: () => ({
      dateTime: (date: Date) => date.toISOString(),
      number: (n: number) => String(n),
      relativeTime: (date: Date) => date.toISOString(),
    }),
  };
});

// ─── 10. Framer Motion mock ───────────────────────────────────────────────────
// Disables animations in tests for speed and predictability.
// All motion.* elements render as their HTML counterpart without animation.

vi.mock('framer-motion', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const React = await vi.importActual<typeof import('react')>('react');

  const makeStaticComponent =
    (tag: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Component = ({ children, ...rest }: any) => {
        const { initial, animate, exit, whileHover, whileTap, whileFocus, transition, variants, layout, layoutId, ...htmlProps } = rest;
        void initial; void animate; void exit; void whileHover; void whileTap; void whileFocus;
        void transition; void variants; void layout; void layoutId;
        return React.createElement(tag, htmlProps, children);
      };
      Component.displayName = `Motion.${tag}`;
      return Component;
    };

  const _tags = ['div', 'span', 'button', 'a', 'li', 'ul', 'nav', 'section', 'header', 'main', 'aside', 'p', 'h1', 'h2', 'h3', 'form', 'label', 'input', 'td', 'tr', 'tbody'];
  void _tags;
  const motionProxy = new Proxy({} as Record<string, unknown>, {
    get: (_target, prop: string) => makeStaticComponent(prop),
  });

  return {
    ...actual,
    motion: motionProxy,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    useReducedMotion: () => false,
    useAnimation: () => ({
      start: vi.fn(),
      stop: vi.fn(),
      set: vi.fn(),
    }),
    useMotionValue: (initial: number) => ({
      get: () => initial,
      set: vi.fn(),
      onChange: vi.fn(),
    }),
    useTransform: (value: unknown, input: unknown, output: unknown[]) => ({
      get: () => output[0],
      set: vi.fn(),
    }),
    useDragControls: () => ({
      start: vi.fn(),
    }),
    usePresence: () => [true, vi.fn()],
    useIsPresent: () => true,
  };
});

// ─── 11. socket.io-client mock ────────────────────────────────────────────────
// Prevents real WebSocket connections in tests.

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    connected: false,
    id: 'mock-socket-id',
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    removeAllListeners: vi.fn(),
  })),
}));

// ─── 12. Suppress known noisy warnings ───────────────────────────────────────

beforeAll(() => {
  // eslint-disable-next-line no-console
  const originalError = console.error.bind(console);
  // eslint-disable-next-line no-console
  const originalWarn = console.warn.bind(console);

  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const msg = String(args[0] ?? '');
    // Suppress React 18/19 hydration mismatch warnings in tests
    if (msg.includes('Warning: ReactDOM.render')) return;
    if (msg.includes('inside a test was not wrapped in act')) return;
    // Suppress Radix UI server-side rendering warnings
    if (msg.includes('Warning: An update to') && msg.includes('inside a test')) return;
    originalError(...args);
  });

  vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    const msg = String(args[0] ?? '');
    // Suppress next-themes SSR hydration warning
    if (msg.includes('next-themes')) return;
    // Suppress Recharts defaultProps deprecation
    if (msg.includes('defaultProps')) return;
    originalWarn(...args);
  });
});

// ─── 13. localStorage / sessionStorage mock ────────────────────────────────────
// jsdom provides these natively, but we reset between tests for isolation.

beforeAll(() => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = String(value); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
      get length() { return Object.keys(store).length; },
      key: (i: number) => Object.keys(store)[i] ?? null,
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    writable: true,
    configurable: true,
    value: localStorageMock,
  });
});

afterEach(() => {
  window.localStorage.clear();
});
