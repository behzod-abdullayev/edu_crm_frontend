'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, useReducedMotion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginSuccessResponse {
  user: {
    role: 'student' | 'teacher' | 'admin' | 'owner';
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    [key: string]: unknown;
  };
  token: string;
}

interface ApiFieldError {
  field: keyof LoginFormValues;
  message: string;
}

interface LoginErrorResponse {
  message?: string;
  errors?: ApiFieldError[];
}

type LoginApiResponse = LoginSuccessResponse & LoginErrorResponse;

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_DASHBOARD: Record<string, string> = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  admin:   '/admin/dashboard',
  owner:   '/owner/dashboard',
};

const LOCALES = ['UZ', 'RU', 'EN'] as const;

// ─── Input style helpers ──────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  width: '100%',
  height: 48,
  padding: '0 14px',
  border: '1.5px solid var(--border-default)',
  borderRadius: 'var(--radius-md, 8px)',
  fontSize: 16,
  color: 'var(--text-primary)',
  background: 'var(--bg-surface)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color var(--transition-base, 200ms ease)',
};

// ─── Inner form — must be inside <Suspense> for useSearchParams ───────────────

function LoginFormInner() {
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const setUser   = useAuthStore((s) => s.setUser);
  const setTokens = useAuthStore((s) => s.setTokens);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  // ── Submit handler ──────────────────────────────────────────────────────────

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          rememberMe: values.rememberMe,
        }),
      });

      let data: LoginApiResponse;
      try {
        data = (await res.json()) as LoginApiResponse;
      } catch {
        setServerError(`Server error (${res.status}). Please try again.`);
        return;
      }

      if (res.ok) {
        if (data.user) {
          setUser(
            data.user as unknown as Parameters<typeof setUser>[0],
          );
          setTokens({
            accessToken:  data.token,
            refreshToken: '',
            expiresIn:    values.rememberMe ? 604_800 : 900,
          });
        }
        const redirectTo = searchParams?.get('redirect');
        const dashboard  = ROLE_DASHBOARD[data.user?.role ?? ''] ?? '/';
        router.replace(
          redirectTo && redirectTo !== '/' ? redirectTo : dashboard,
        );
        return;
      }

      // Backend field-level validation errors
      if (data.errors?.length) {
        data.errors.forEach(({ field, message }) =>
          setError(field, { message }),
        );
        return;
      }
      setServerError(data.message ?? 'Login failed. Please try again.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setServerError(`Network error: ${msg}`);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'var(--bg-page)',
      }}
    >
      {/* Card */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 350, damping: 30 }
        }
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl, 16px)',
          boxShadow: 'var(--shadow-xl)',
          padding: '32px 28px',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            aria-hidden="true"
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'var(--brand-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              fontSize: 22,
            }}
          >
            🎓
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            Welcome back
          </h1>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 14,
              color: 'var(--text-muted)',
            }}
          >
            Sign in to your EduCRM account
          </p>
        </div>

        {/* Server-level error */}
        {serverError && (
          <motion.div
            role="alert"
            aria-live="assertive"
            initial={shouldReduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              background: 'var(--error-bg)',
              border: '1px solid var(--error-border)',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: 14,
              color: 'var(--error-text)',
            }}
          >
            {serverError}
          </motion.div>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
        >
          {/* ── Email ── */}
          <div>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 6,
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
              aria-required="true"
              {...register('email')}
              style={{
                ...inputBase,
                borderColor: errors.email
                  ? 'var(--error-solid)'
                  : 'var(--border-default)',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-focus)';
                e.currentTarget.style.boxShadow =
                  '0 0 0 3px color-mix(in srgb, var(--brand-primary) 15%, transparent)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = errors.email
                  ? 'var(--error-solid)'
                  : 'var(--border-default)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            {errors.email && (
              <p
                id="email-error"
                role="alert"
                style={{
                  margin: '4px 0 0',
                  fontSize: 12,
                  color: 'var(--error-solid)',
                }}
              >
                {errors.email.message}
              </p>
            )}
          </div>

          {/* ── Password ── */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <label
                htmlFor="password"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                style={{
                  fontSize: 13,
                  color: 'var(--brand-primary)',
                  textDecoration: 'none',
                }}
              >
                Forgot password?
              </Link>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={
                  errors.password ? 'password-error' : undefined
                }
                aria-required="true"
                {...register('password')}
                style={{
                  ...inputBase,
                  padding: '0 52px 0 14px',
                  borderColor: errors.password
                    ? 'var(--error-solid)'
                    : 'var(--border-default)',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-focus)';
                  e.currentTarget.style.boxShadow =
                    '0 0 0 3px color-mix(in srgb, var(--brand-primary) 15%, transparent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.password
                    ? 'var(--error-solid)'
                    : 'var(--border-default)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
              <motion.button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 0,
                  width: 48,
                  height: 48,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                {showPassword ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </motion.button>
            </div>

            {errors.password && (
              <p
                id="password-error"
                role="alert"
                style={{
                  margin: '4px 0 0',
                  fontSize: 12,
                  color: 'var(--error-solid)',
                }}
              >
                {errors.password.message}
              </p>
            )}
          </div>

          {/* ── Remember me ── */}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              minHeight: 44,
            }}
          >
            <input
              type="checkbox"
              {...register('rememberMe')}
              style={{
                width: 18,
                height: 18,
                accentColor: 'var(--brand-primary)',
                cursor: 'pointer',
              }}
            />
            <span
              style={{ fontSize: 14, color: 'var(--text-secondary)' }}
            >
              Remember me
            </span>
          </label>

          {/* ── Submit ── */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            whileTap={shouldReduceMotion || isSubmitting ? {} : { scale: 0.97 }}
            whileHover={
              shouldReduceMotion || isSubmitting
                ? {}
                : { filter: 'brightness(1.08)' }
            }
            style={{
              width: '100%',
              height: 52,
              background: 'var(--brand-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md, 8px)',
              fontSize: 16,
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: isSubmitting ? 0.75 : 1,
              marginTop: 4,
            }}
          >
            {isSubmitting && (
              <Loader2
                size={18}
                aria-hidden="true"
                style={{ animation: 'spin 0.8s linear infinite' }}
              />
            )}
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </motion.button>
        </form>
      </motion.div>

      {/* Language switcher */}
      <div style={{ marginTop: 20, display: 'flex', gap: 4 }}>
        {LOCALES.map((lang) => (
          <button
            key={lang}
            aria-label={`Switch language to ${lang}`}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 13,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px 10px',
              minHeight: 44,
              borderRadius: 'var(--radius-sm, 6px)',
            }}
          >
            {lang}
          </button>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Export — wraps inner form in Suspense (required for useSearchParams) ─────

export function LoginClient() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100dvh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-page)',
          }}
        >
          <Loader2
            size={32}
            aria-hidden="true"
            style={{
              animation: 'spin 0.8s linear infinite',
              color: 'var(--brand-primary)',
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <LoginFormInner />
    </Suspense>
  );
}
