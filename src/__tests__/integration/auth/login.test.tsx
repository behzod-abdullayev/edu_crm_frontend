import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import LoginPage from '@/app/(auth)/login/page';
import { useAuthStore } from '@/store/auth.store';

expect.extend(toHaveNoViolations);

// Mock Next.js navigation (NO react-router-dom — this is a Next.js 15 project)
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/login',
}));

// Mock next-intl translations
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

// Mock the auth store
vi.mock('@/store/auth.store', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/store/auth.store')>();
  return {
    ...actual,
    useAuthStore: vi.fn(() => ({
      ...actual.useAuthStore.getState(),
      login: vi.fn(),
      isAuthenticated: false,
      isLoading: false,
    })),
  };
});

// Mock the auth API
vi.mock('@/services/api/auth.api', () => ({
  authApi: {
    login: vi.fn(),
    me: vi.fn(),
  },
}));

function renderLogin() {
  return render(<LoginPage />);
}

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
      const submitBtn = screen.getByRole('button', { name: /sign in|log in|kirish|login/i });
      await user.click(submitBtn);
      await waitFor(() => {
        expect(screen.getByText(/required|majburiy/i)).toBeInTheDocument();
      });
    });

    it('shows required error for empty password on submit', async () => {
      const user = userEvent.setup();
      renderLogin();
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'test@example.com');
      const submitBtn = screen.getByRole('button', { name: /sign in|log in|kirish|login/i });
      await user.click(submitBtn);
      await waitFor(() => {
        const errors = screen.getAllByRole('alert');
        expect(errors.length).toBeGreaterThan(0);
      });
    });

    it('shows email format error for invalid email', async () => {
      const user = userEvent.setup();
      renderLogin();
      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'notanemail');
      const submitBtn = screen.getByRole('button', { name: /sign in|log in|kirish|login/i });
      await user.click(submitBtn);
      await waitFor(() => {
        expect(screen.getByText(/invalid email|email format|noto.g.ri/i)).toBeInTheDocument();
      });
    });
  });

  // ─── Successful submission ─────────────────────────────────────────────────

  describe('successful submission', () => {
    it('calls authStore.login() with correct credentials', async () => {
      const mockLogin = vi.fn().mockResolvedValueOnce(undefined);
      vi.mocked(useAuthStore).mockReturnValue({
        ...useAuthStore.getState(),
        login: mockLogin,
        isAuthenticated: false,
        isLoading: false,
      } as ReturnType<typeof useAuthStore>);

      const user = userEvent.setup();
      renderLogin();

      await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
      await user.type(screen.getByLabelText(/password/i), 'TestPass123!');
      await user.click(screen.getByRole('button', { name: /sign in|log in|kirish|login/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          email: 'admin@test.com',
          password: 'TestPass123!',
        });
      });
    });
  });

  // ─── API error handling ────────────────────────────────────────────────────

  describe('API error handling', () => {
    it('shows field errors below inputs when API returns field errors', async () => {
      const mockLogin = vi.fn().mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            errors: { email: ['Email not found'] },
          },
        },
      });
      vi.mocked(useAuthStore).mockReturnValue({
        ...useAuthStore.getState(),
        login: mockLogin,
        isAuthenticated: false,
        isLoading: false,
      } as ReturnType<typeof useAuthStore>);

      const user = userEvent.setup();
      renderLogin();
      await user.type(screen.getByLabelText(/email/i), 'notfound@test.com');
      await user.type(screen.getByLabelText(/password/i), 'TestPass123!');
      await user.click(screen.getByRole('button', { name: /sign in|log in|kirish|login/i }));

      await waitFor(() => {
        expect(screen.getByText(/email not found/i)).toBeInTheDocument();
      });
    });

    it('shows general error toast when API returns non-field error', async () => {
      const mockLogin = vi.fn().mockRejectedValueOnce({
        response: {
          status: 401,
          data: { message: 'Invalid credentials' },
        },
      });
      vi.mocked(useAuthStore).mockReturnValue({
        ...useAuthStore.getState(),
        login: mockLogin,
        isAuthenticated: false,
        isLoading: false,
      } as ReturnType<typeof useAuthStore>);

      const user = userEvent.setup();
      renderLogin();
      await user.type(screen.getByLabelText(/email/i), 'test@test.com');
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
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      const mockLogin = vi.fn().mockReturnValueOnce(loginPromise);
      vi.mocked(useAuthStore).mockReturnValue({
        ...useAuthStore.getState(),
        login: mockLogin,
        isAuthenticated: false,
        isLoading: false,
      } as ReturnType<typeof useAuthStore>);

      const user = userEvent.setup();
      renderLogin();
      await user.type(screen.getByLabelText(/email/i), 'test@test.com');
      await user.type(screen.getByLabelText(/password/i), 'TestPass123!');
      await user.click(screen.getByRole('button', { name: /sign in|log in|kirish|login/i }));

      expect(
        screen.getByRole('button', { name: /sign in|log in|kirish|loading|login/i })
      ).toBeDisabled();

      resolveLogin();
    });

    it('shows spinner/loading indicator while submitting', async () => {
      let resolveLogin!: () => void;
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      const mockLogin = vi.fn().mockReturnValueOnce(loginPromise);
      vi.mocked(useAuthStore).mockReturnValue({
        ...useAuthStore.getState(),
        login: mockLogin,
        isAuthenticated: false,
        isLoading: false,
      } as ReturnType<typeof useAuthStore>);

      const user = userEvent.setup();
      renderLogin();
      await user.type(screen.getByLabelText(/email/i), 'test@test.com');
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