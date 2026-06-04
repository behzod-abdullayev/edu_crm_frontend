'use client';

/**
 * ResetPasswordClient — /[locale]/reset-password?token=<jwt>
 *
 * Responsibilities:
 *  - Reads `token` from URL search params (hence must be a Client Component)
 *  - Shows an error card when the token is missing/invalid
 *  - Validates new password + confirmation via Zod + React Hook Form
 *  - POSTs to /api/auth/reset-password (Next.js route handler → proxies to backend)
 *  - On success: shows a success state then redirects to /[locale]/login after 3 s
 *  - Full i18n via next-intl useTranslations
 *  - Fully accessible: ARIA labels, focus management, reduced motion support
 *  - Mobile-first layout that works from 320 px to 2560 px
 */

import { useState, useRef, useEffect, useId } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@shared/utils/cn';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof resetSchema>;

// ─── Sub-component: password input with show/hide toggle ─────────────────────

interface PasswordFieldProps {
  id: string;
  label: string;
  name: 'password' | 'confirmPassword';
  show: boolean;
  onToggle: () => void;
  /** undefined = no error (exactOptionalPropertyTypes safe) */
  error?: string | undefined;
  register: ReturnType<typeof useForm<FormValues>>['register'];
  autoComplete?: string | undefined;
  inputRef?: React.RefObject<HTMLInputElement | null> | undefined;
}

function PasswordField({
  id,
  label,
  name,
  show,
  onToggle,
  error,
  register,
  autoComplete = 'new-password',
  inputRef,
}: PasswordFieldProps) {
  const errorId = `${id}-error`;
  const { ref: hookRef, ...rest } = register(name);

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-[var(--text-primary)]"
      >
        {label}
        <span aria-hidden="true" className="ml-1 text-[var(--error-solid)]">
          *
        </span>
      </label>

      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          aria-required="true"
          ref={(el) => {
            hookRef(el);
            if (inputRef) {
              (
                inputRef as React.MutableRefObject<HTMLInputElement | null>
              ).current = el;
            }
          }}
          {...rest}
          className={cn(
            'w-full rounded-lg border bg-[var(--bg-surface)] pe-12 ps-4',
            'h-12 min-h-[44px] text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
            'outline-none transition-colors duration-[var(--transition-fast)]',
            'focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20',
            error
              ? 'border-[var(--error-solid)] focus:ring-[var(--error-solid)]/20'
              : 'border-[var(--border-default)]',
          )}
        />

        {/* Show/hide toggle */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={
            show
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
          className={cn(
            'absolute inset-y-0 end-0 flex w-12 items-center justify-center',
            'rounded-e-lg text-[var(--text-muted)] transition-colors',
            'hover:text-[var(--text-secondary)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset',
            'focus-visible:ring-[var(--border-focus)]',
          )}
        >
          {show ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Inline error */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key="error"
            id={errorId}
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-[var(--error-solid)]"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ResetPasswordClientProps {
  locale: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ResetPasswordClient({ locale }: ResetPasswordClientProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduced = useReducedMotion() ?? false;
  const firstInputRef = useRef<HTMLInputElement | null>(null);
  const successHeadingId = useId();

  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | undefined>(
    undefined,
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<FormValues>({ resolver: zodResolver(resetSchema) });

  // Auto-focus first input (only if token is present)
  useEffect(() => {
    if (token) {
      firstInputRef.current?.focus();
    }
  }, [token]);

  async function onSubmit(values: FormValues) {
    if (!token) {
      setServerError('Invalid or missing reset token.');
      return;
    }
    setServerError(undefined);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: values.password }),
      });

      if (res.ok) {
        setSuccess(true);
        const timer = window.setTimeout(() => {
          router.replace(`/${locale}/login`);
        }, 3000);
        return () => window.clearTimeout(timer);
      }

      const data = (await res.json()) as {
        message?: string;
        errors?: Record<string, string[]>;
      };

      // Map field-level errors from backend into React Hook Form
      if (data.errors && typeof data.errors === 'object') {
        for (const [field, messages] of Object.entries(data.errors)) {
          if (field === 'password' || field === 'confirmPassword') {
            setError(field, { message: messages[0] ?? 'Invalid value' });
          }
        }
      }

      setServerError(
        data.message ?? 'Reset failed. The link may have expired.',
      );
    } catch {
      setServerError('Network error. Please try again.');
    }
  }

  // ── Shared card motion config ──────────────────────────────────────────────

  const cardMotion = {
    initial: reduced ? {} : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: reduced
      ? { duration: 0 }
      : { type: 'spring' as const, stiffness: 350, damping: 30 },
  };

  // ── Invalid / missing token guard ─────────────────────────────────────────

  if (!token) {
    return (
      <main
        className="flex min-h-dvh flex-col items-center justify-center px-4 py-8"
        style={{ background: 'var(--bg-page)' }}
      >
        <motion.div
          {...cardMotion}
          className={cn(
            'w-full max-w-[400px] rounded-[var(--radius-xl)]',
            'border border-[var(--error-border)] bg-[var(--error-bg)]',
            'p-8 text-center',
          )}
          style={{ boxShadow: 'var(--shadow-xl)' }}
          role="alert"
          aria-live="assertive"
        >
          <AlertTriangle
            size={44}
            aria-hidden="true"
            className="mx-auto mb-4 text-[var(--error-solid)]"
          />
          <h1 className="mb-2 text-xl font-bold text-[var(--text-primary)]">
            Invalid reset link
          </h1>
          <p className="mb-6 text-sm text-[var(--text-secondary)]">
            This password reset link is invalid or has expired. Please request a
            new one.
          </p>
          <Link
            href={`/${locale}/forgot-password`}
            className={cn(
              'inline-flex min-h-[44px] w-full items-center justify-center',
              'rounded-lg bg-[var(--brand-primary)] px-6 text-sm font-semibold text-white',
              'transition-colors duration-[var(--transition-fast)]',
              'hover:bg-[var(--brand-primary-hover)]',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
            )}
          >
            Request a new link
          </Link>
        </motion.div>
      </main>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────

  return (
    <main
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-8"
      style={{ background: 'var(--bg-page)' }}
    >
      <motion.div
        {...cardMotion}
        className={cn(
          'w-full max-w-[400px] overflow-hidden rounded-[var(--radius-xl)]',
          'border border-[var(--border-default)] bg-[var(--bg-surface)]',
          'p-8',
        )}
        style={{ boxShadow: 'var(--shadow-xl)' }}
      >
        <AnimatePresence mode="wait">
          {/* ── Success state ─────────────────────────────────────────── */}
          {success ? (
            <motion.div
              key="success"
              initial={reduced ? {} : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-4 py-4 text-center"
              role="status"
              aria-labelledby={successHeadingId}
            >
              <motion.div
                initial={reduced ? {} : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : { type: 'spring' as const, stiffness: 400, damping: 20 }
                }
              >
                <CheckCircle2
                  size={56}
                  aria-hidden="true"
                  className="text-[var(--success-solid)]"
                />
              </motion.div>
              <h2
                id={successHeadingId}
                className="text-xl font-bold text-[var(--text-primary)]"
              >
                {t('resetSuccess')}
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                Your password has been updated. Redirecting you to login in 3
                seconds…
              </p>
              <Link
                href={`/${locale}/login`}
                className={cn(
                  'mt-2 inline-flex min-h-[44px] w-full items-center justify-center',
                  'rounded-lg bg-[var(--brand-primary)] px-6 text-sm font-semibold text-white',
                  'hover:bg-[var(--brand-primary-hover)]',
                  'transition-colors duration-[var(--transition-fast)]',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
                )}
              >
                {t('login')}
              </Link>
            </motion.div>
          ) : (
            /* ── Form state ─────────────────────────────────────────── */
            <motion.div
              key="form"
              initial={reduced ? {} : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              {/* Header */}
              <div className="mb-7 flex flex-col items-center gap-3 text-center">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/10"
                  aria-hidden="true"
                >
                  <Lock
                    size={28}
                    className="text-[var(--brand-primary)]"
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[var(--text-primary)]">
                    {t('resetPassword')}
                  </h1>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Choose a strong password for your account.
                  </p>
                </div>
              </div>

              {/* Server-level error banner */}
              <AnimatePresence>
                {serverError && (
                  <motion.div
                    initial={reduced ? {} : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={reduced ? {} : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.18 }}
                    role="alert"
                    aria-live="assertive"
                    className={cn(
                      'mb-5 flex items-start gap-2.5 rounded-lg',
                      'border border-[var(--error-border)] bg-[var(--error-bg)]',
                      'p-3 text-sm text-[var(--error-text)]',
                    )}
                  >
                    <AlertTriangle
                      size={16}
                      aria-hidden="true"
                      className="mt-0.5 shrink-0"
                    />
                    <span>{serverError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="space-y-5"
                aria-label={t('resetPassword')}
              >
                {/* New password */}
                <PasswordField
                  id="reset-password"
                  label={t('newPassword')}
                  name="password"
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                  error={errors.password?.message}
                  register={register}
                  autoComplete="new-password"
                  inputRef={firstInputRef}
                />

                {/* Confirm password */}
                <PasswordField
                  id="reset-confirm-password"
                  label={t('confirmPassword')}
                  name="confirmPassword"
                  show={showConfirm}
                  onToggle={() => setShowConfirm((v) => !v)}
                  error={errors.confirmPassword?.message}
                  register={register}
                  autoComplete="new-password"
                />

                {/* Requirements hint */}
                <p className="text-[11px] text-[var(--text-muted)]">
                  At least 8 characters, one uppercase letter, and one number.
                </p>

                {/* Submit */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  whileTap={reduced ? {} : { scale: 0.97 }}
                  className={cn(
                    'flex w-full min-h-[52px] items-center justify-center gap-2',
                    'rounded-lg bg-[var(--brand-primary)] px-6',
                    'text-base font-bold text-white',
                    'transition-colors duration-[var(--transition-fast)]',
                    'hover:bg-[var(--brand-primary-hover)]',
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
                    'disabled:cursor-not-allowed disabled:opacity-60',
                  )}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        size={18}
                        aria-hidden="true"
                        className="animate-spin"
                      />
                      <span>Updating…</span>
                    </>
                  ) : (
                    t('resetPassword')
                  )}
                </motion.button>
              </form>

              {/* Back to login */}
              <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
                Remember your password?{' '}
                <Link
                  href={`/${locale}/login`}
                  className={cn(
                    'font-semibold text-[var(--brand-primary)]',
                    'hover:text-[var(--brand-primary-hover)] hover:underline',
                    'focus-visible:outline-none focus-visible:ring-1',
                    'focus-visible:ring-[var(--border-focus)] rounded',
                  )}
                >
                  {t('login')}
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
