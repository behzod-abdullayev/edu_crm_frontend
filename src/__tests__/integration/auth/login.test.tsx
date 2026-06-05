import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

/**
 * LoginPage (page.tsx) — async Server Component bo'lib, uni to'g'ridan-to'g'ri
 * render qilib bo'lmaydi (Next.js 15 App Router, params/searchParams Promise).
 *
 * Asl test maqsadi form logikasi bo'lgani uchun LoginClient render qilamiz —
 * bu haqiqiy interaktiv komponent (React Hook Form + Zod + authApi).
 */
import { LoginClient } from '@/app/[locale]/(auth)/login/LoginClient';
import { authApi } from '@/services/api/auth.api';
import { useAuthStore } from '@/store/auth.store';
import React from 'react';

expect.extend(toHaveNoViolations);

// ─── Next.js navigation mock ──────────────────────────────────────────────────
const mockPush    = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter:      () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
  usePathname:    () => '/login',
}));

// ─── next/link mock ───────────────────────────────────────────────────────────
vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// ─── next-intl mock ───────────────────────────────────────────────────────────
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale:       () => 'en',
}));

// ─── framer-motion mock ───────────────────────────────────────────────────────
vi.mock('framer-motion', () => ({
  motion: new Proxy({}, {
    get: (_target, tag: string) =>
      ({ children, ...props }: React.HTMLAttributes<HTMLElement>) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        React.createElement(tag as any, props, children),
  }),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

// ─── Auth API mock ────────────────────────────────────────────────────────────
vi.mock('@/services/api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    getMe:  vi.fn(),
  },
}));

// ─── Shared utils mock ────────────────────────────────────────────────────────
vi.mock('@/shared/utils/api-error', () => ({
  parseApiError: (err: unknown) => {
    const e = err as { response?: { status: number; data?: { message?: string; errors?: Record<string, string[]> } } };
    return {
      message: e?.response?.data?.message ?? 'Unknown error',
      errors:  e?.response?.data?.errors,
      status:  e?.response?.status,
    };
  },
}));

vi.mock('@/shared/utils/cn', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

// ─── Auth store mock ──────────────────────────────────────────────────────────
vi.mock('@/store/auth.store', () => ({
  useAuthStore: vi.fn((selector?: (state: ReturnType<typeof createStoreMock>) => unknown) => {
    const state = createStoreMock();
    return typeof selector === 'function' ? selector(state) : state;
  }),
}));

function createStoreMock() {
  return {
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: false,
    setTokens: vi.fn(),
    setUser:   vi.fn(),
    clearAuth: vi.fn(),
    syncMe:    vi.fn(),
    login:     vi.fn(),
    logout:    vi.fn(),
  };
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderLogin() {
  return render(
    <LoginClient redirectTo={undefined} initialError={undefined} locale="en" />
  );
}

// ─────────────────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Form rendering ────────────────────────────────────────────────────────

  describe('form rendering', () => {
    it('renders email input', () => {
      renderLogin();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('renders password input', () => {
      renderLogin();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('renders submit button', () => {
      renderLogin();
      expect(
        screen.getByRole('button', { name: /sign in|log in|kirish|login/i })
      ).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      renderLogin();
      expect(
        screen.getByText(/forgot password|parolni unutdingizmi|forgot/i)
      ).toBeInTheDocument();
    });
  });

  // ─── Validation ────────────────────────────────────────────────────────────

  describe('validation', () => {
    it('shows required error for empty email on submit', async () => {
      const user = userEvent.setup();
      renderLogin();
      await user.click(screen.getByRole('button', { name: /sign in|log in|kirish|login/i }));
      await waitFor(() => {
        expect(screen.getByText(/required|majburiy/i)).toBeInTheDocument();
      });
    });

    it('shows required error for empty password on submit', async () => {
      const user = userEvent.setup();
      renderLogin();
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.click(screen.getByRole('button', { name: /sign in|log in|kirish|login/i }));
      await waitFor(() => {
        const errors = screen.getAllByRole('alert');
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    it('shows email format error for invalid email', async () => {
      const user = userEvent.setup();
      renderLogin();
      await user.type(screen.getByLabelText(/email/i), 'notanemail');
      await user.click(screen.getByRole('button', { name: /sign in|log in|kirish|login/i }));
      await waitFor(() => {
        expect(screen.getByText(/invalid email|email format|noto.g.ri/i)).toBeInTheDocument();
      });
    });
  });

  // ─── Successful submission ─────────────────────────────────────────────────

  describe('successful submission', () => {
    it('calls authApi.login() with correct credentials', async () => {
      vi.mocked(authApi.login).mockResolvedValueOnce({
        accessToken:  'access-token',
        refreshToken: 'refresh-token',
        expiresIn:    900,
        user: {
          id: '1', email: 'admin@test.com', firstName: 'Admin',
          lastName: 'User', role: 'admin', permissions: [],
          tenantId: 'tenant-1', isActive: true,
          createdAt: '', updatedAt: '',
        },
      });

      const setTokensMock = vi.fn();
      const setUserMock   = vi.fn();
      vi.mocked(useAuthStore).mockImplementation(
        (selector?: (s: ReturnType<typeof createStoreMock>) => unknown) => {
          const state = { ...createStoreMock(), setTokens: setTokensMock, setUser: setUserMock };
          return typeof selector === 'function' ? selector(state) : state;
        }
      );

      const user = userEvent.setup();
      renderLogin();

      await user.type(screen.getByLabelText(/email/i),    'admin@test.com');
      await user.type(screen.getByLabelText(/password/i), 'TestPass123!');
      await user.click(screen.getByRole('button', { name: /sign in|log in|kirish|login/i }));

      await waitFor(() => {
        expect(authApi.login).toHaveBeenCalledWith({
          email:    'admin@test.com',
          password: 'TestPass123!',
        });
      });
    });
  });

  // ─── API error handling ────────────────────────────────────────────────────

  describe('API error handling', () => {
    it('shows field errors below inputs when API returns field errors', async () => {
      vi.mocked(authApi.login).mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            errors: { email: ['Email not found'] },
          },
        },
      });

      const user = userEvent.setup();
      renderLogin();
      await user.type(screen.getByLabelText(/email/i),    'notfound@test.com');
      await user.type(screen.getByLabelText(/password/i), 'TestPass123!');
      await user.click(screen.getByRole('button', { name: /sign in|log in|kirish|login/i }));

      await waitFor(() => {
        expect(screen.getByText(/email not found/i)).toBeInTheDocument();
      });
    });

    it('shows general error alert when API returns non-field error', async () => {
      vi.mocked(authApi.login).mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      });

      const user = userEvent.setup();
      renderLogin();
      await user.type(screen.getByLabelText(/email/i),    'test@test.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpass');
      await user.click(screen.getByRole('button', { name: /sign in|log in|kirish|login/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  // ─── Loading state ─────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('submit button is disabled while loading', async () => {
      let resolveLogin!: () => void;
      vi.mocked(authApi.login).mockReturnValueOnce(
        new Promise<never>((res) => { resolveLogin = res as () => void; })
      );

      const user = userEvent.setup();
      renderLogin();
      await user.type(screen.getByLabelText(/email/i),    'test@test.com');
      await user.type(screen.getByLabelText(/password/i), 'TestPass123!');
      await user.click(screen.getByRole('button', { name: /sign in|log in|kirish|login/i }));

      expect(
        screen.getByRole('button', { name: /sign in|log in|kirish|loading|login/i })
      ).toBeDisabled();

      resolveLogin();
    });

    it('shows spinner/loading indicator while submitting', async () => {
      let resolveLogin!: () => void;
      vi.mocked(authApi.login).mockReturnValueOnce(
        new Promise<never>((res) => { resolveLogin = res as () => void; })
      );

      const user = userEvent.setup();
      renderLogin();
      await user.type(screen.getByLabelText(/email/i),    'test@test.com');
      await user.type(screen.getByLabelText(/password/i), 'TestPass123!');
      await user.click(screen.getByRole('button', { name: /sign in|log in|kirish|login/i }));

      const spinner = document.querySelector(
        '[data-testid="spinner"], .animate-spin, [aria-label="loading"]'
      );
      expect(spinner).toBeTruthy();

      resolveLogin();
    });
  });

  // ─── Accessibility ─────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('passes axe accessibility check on login form', async () => {
      const { container } = renderLogin();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});