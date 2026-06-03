'use client';

/**
 * LoginClient — Client Component
 * All interactive login logic lives here so the parent Server Component
 * can remain a pure RSC and export generateMetadata() correctly.
 *
 * Features:
 *  - React Hook Form + Zod validation
 *  - Framer Motion animations (prefers-reduced-motion aware)
 *  - Backend field-level error mapping (setError per field)
 *  - Zustand auth store integration (setUser + setTokens)
 *  - Role-based dashboard redirect after login
 *  - Language switcher (next-intl locale switch)
 *  - Accessible: ARIA roles, focus management, keyboard submit
 *  - Dark/light mode via CSS variables (no inline colors)
 *  - Zero hardcoded strings — all from translation files
 *
 * TS FIXES applied (exactOptionalPropertyTypes: true):
 *  1. LoginClientProps.redirectTo / initialError — changed to required with
 *     explicit `| undefined` so `string | undefined` satisfies the strict type.
 *  2. Framer Motion `variants` / `whileTap` / `whileHover` props —
 *     narrowed with explicit non-undefined types via conditional spread.
 *  3. setError() call — messages[0] guarded to always be `string`.
 */

import { Suspense, useState, useId } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  motion,
  useReducedMotion,
  type Variants,
  type TargetAndTransition,
} from 'framer-motion';
import { Eye, EyeOff, Loader2, GraduationCap } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/services/api/auth.api';
import { parseApiError } from '@/shared/utils/api-error';
import { cn } from '@/shared/utils/cn';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_DASHBOARD: Record<string, string> = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  admin:   '/admin/dashboard',
  owner:   '/owner/dashboard',
} as const;

const LOCALES = ['uz', 'en', 'ru'] as const;
const LOCALE_LABELS: Record<string, string> = {
  uz: 'UZ',
  en: 'EN',
  ru: 'RU',
};

// ─── Zod schema ───────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'auth.emailRequired')
    .email('auth.emailInvalid'),
  password: z
    .string()
    .min(1, 'auth.passwordRequired')
    .min(6, 'auth.passwordTooShort'),
  rememberMe: z.boolean().optional().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Animation helpers ────────────────────────────────────────────────────────

/** Card entrance animation variants */
const CARD_VARIANTS: Variants = {
  hidden:  { opacity: 0, scale: 0.96, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 28 },
  },
};

/** Logo icon bounce variants */
const LOGO_VARIANTS: Variants = {
  hidden:  { scale: 0.7, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 22 },
  },
};

/** Stagger field variants */
const FIELD_VARIANTS: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.2 },
  }),
};

/** Framer Motion target for whileTap */
const BUTTON_WHILE_TAP: TargetAndTransition  = { scale: 0.9  };
const SUBMIT_WHILE_TAP: TargetAndTransition  = { scale: 0.97 };
const SUBMIT_WHILE_HOVER: TargetAndTransition = { scale: 1.01 };

// ─── Props ────────────────────────────────────────────────────────────────────

/**
 * exactOptionalPropertyTypes: true  ← tsconfig is set this way.
 *
 * With that flag, an optional property `foo?: string` means the key may be
 * absent, but if it IS present it MUST be `string` (not `string | undefined`).
 *
 * To allow the caller to pass `undefined` explicitly (which Next.js searchParams
 * does when a param is not in the URL) we use `foo: string | undefined` instead
 * of `foo?: string`.  That way the type is always present in the object but
 * its value may be undefined — satisfying both callers and strict TS.
 */
export interface LoginClientProps {
  redirectTo:   string | undefined;
  initialError: string | undefined;
  locale:       string;
}

// ─── Inner form (uses useSearchParams — must be inside Suspense) ──────────────

function LoginForm({
  redirectTo,
  initialError,
}: Omit<LoginClientProps, 'locale'>) {
  const t = useTranslations('auth');
  const currentLocale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldReduceMotion = useReducedMotion();
  const emailId    = useId();
  const passwordId = useId();
  const errorId    = useId();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError]   = useState<string | null>(
    initialError ?? null,
  );

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

  // ── Submit handler ─────────────────────────────────────────────────────────
  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const result = await authApi.login({
        email:    values.email,
        password: values.password,
      });

      setTokens({
        accessToken:  result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn:    values.rememberMe ? 604_800 : 900,
      });
      setUser(result.user);

      const redirect =
        redirectTo ??
        searchParams?.get('redirect') ??
        ROLE_DASHBOARD[result.user.role] ??
        '/';

      const safePath =
        redirect.startsWith('/') && !redirect.startsWith('//')
          ? redirect
          : ROLE_DASHBOARD[result.user.role] ?? '/';

      router.replace(`/${currentLocale}${safePath}`);
    } catch (err: unknown) {
      const parsed = parseApiError(err);

      if (parsed.errors) {
        Object.entries(parsed.errors).forEach(([field, messages]) => {
          if (field === 'email' || field === 'password') {
            // Guard: messages[0] might be undefined at runtime
            const msg = messages[0];
            if (msg !== undefined) {
              // exactOptionalPropertyTypes: message must be `string` not
              // `string | undefined`, so we only call setError when we have one.
              setError(field, { message: msg });
            }
          }
        });
        return;
      }

      setServerError(parsed.message ?? t('invalidCredentials'));
    }
  }

  // ── Locale switch ──────────────────────────────────────────────────────────
  function switchLocale(locale: string) {
    const path = window.location.pathname.replace(/^\/[a-z]{2}/, '');
    router.replace(`/${locale}${path}${window.location.search}`);
  }

  // ── Reduced-motion aware variant helpers ──────────────────────────────────
  //
  // With exactOptionalPropertyTypes, passing `variants={undefined}` to a
  // Framer Motion element that declares `variants: Variants` (not
  // `Variants | undefined`) is a TS error.
  //
  // Fix: use conditional spreads so the `variants` prop is either fully
  // present (with the real value) or completely absent from the object.
  // Same pattern for whileTap / whileHover.

  const cardMotionProps = shouldReduceMotion
    ? { initial: false as const, animate: 'visible' as const }
    : {
        variants: CARD_VARIANTS,
        initial:  'hidden' as const,
        animate:  'visible' as const,
      };

  const logoMotionProps = shouldReduceMotion
    ? { initial: false as const, animate: 'visible' as const }
    : {
        variants: LOGO_VARIANTS,
        initial:  'hidden' as const,
        animate:  'visible' as const,
      };

  /** Returns spread-safe motion props for stagger fields */
  function fieldMotionProps(index: number) {
    return shouldReduceMotion
      ? { initial: false as const, animate: 'visible' as const }
      : {
          custom:  index,
          variants: FIELD_VARIANTS,
          initial: 'hidden' as const,
          animate: 'visible' as const,
        };
  }

  const togglePasswordMotionProps = shouldReduceMotion
    ? {}
    : { whileTap: BUTTON_WHILE_TAP };

  const submitMotionProps = shouldReduceMotion
    ? {}
    : { whileHover: SUBMIT_WHILE_HOVER, whileTap: SUBMIT_WHILE_TAP };

  return (
    <div
      className={cn(
        'flex min-h-dvh flex-col items-center justify-center px-4 py-8',
        'bg-[var(--bg-page)]',
      )}
    >
      <motion.div
        {...cardMotionProps}
        className={cn(
          'w-full max-w-[400px]',
          'rounded-[var(--radius-xl)] border border-[var(--border-default)]',
          'bg-[var(--bg-surface)] p-8',
        )}
        style={{ boxShadow: 'var(--shadow-xl)' }}
      >
        {/* ── Logo + headings ── */}
        <div className="mb-7 flex flex-col items-center text-center">
          <motion.div
            {...logoMotionProps}
            aria-hidden="true"
            className={cn(
              'mb-4 flex h-13 w-13 items-center justify-center rounded-2xl',
              'bg-[var(--brand-primary)] text-white shadow-lg',
            )}
          >
            <GraduationCap size={26} strokeWidth={2} />
          </motion.div>

          <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-[var(--text-primary)]">
            {t('loginTitle')}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            {t('loginSubtitle')}
          </p>
        </div>

        {/* ── Server error alert ── */}
        <AnimatedError show={!!serverError} id={errorId}>
          {serverError ?? ''}
        </AnimatedError>

        {/* ── Form ── */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          aria-label={t('login')}
          className="flex flex-col gap-5"
        >
          {/* Email */}
          <motion.div {...fieldMotionProps(0)}>
            <label
              htmlFor={emailId}
              className="mb-1.5 block text-[13px] font-semibold text-[var(--text-primary)]"
            >
              {t('email')}
              <span aria-hidden="true" className="ml-0.5 text-[var(--error-solid)]">*</span>
            </label>
            <input
              id={emailId}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoFocus
              aria-required="true"
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? `${emailId}-error` : undefined}
              {...register('email')}
              className={cn(
                'h-12 w-full rounded-[var(--radius-md)] border px-3.5 text-base',
                'bg-[var(--bg-surface)] text-[var(--text-primary)]',
                'outline-none transition-all duration-[var(--transition-base)]',
                'placeholder:text-[var(--text-muted)]',
                'focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20',
                errors.email
                  ? 'border-[var(--error-solid)] bg-[var(--error-bg)]'
                  : 'border-[var(--border-default)]',
              )}
            />
            {errors.email && (
              <p
                id={`${emailId}-error`}
                role="alert"
                className="mt-1.5 text-[12px] font-medium text-[var(--error-solid)]"
              >
                {errors.email.message}
              </p>
            )}
          </motion.div>

          {/* Password */}
          <motion.div {...fieldMotionProps(1)}>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor={passwordId}
                className="text-[13px] font-semibold text-[var(--text-primary)]"
              >
                {t('password')}
                <span aria-hidden="true" className="ml-0.5 text-[var(--error-solid)]">*</span>
              </label>
              <Link
                href={`/${currentLocale}/forgot-password`}
                className={cn(
                  'text-[13px] font-medium text-[var(--brand-primary)]',
                  'hover:text-[var(--brand-primary-hover)] hover:underline',
                  'focus-visible:rounded focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]',
                  'transition-colors duration-[var(--transition-fast)]',
                )}
              >
                {t('forgotPassword')}
              </Link>
            </div>

            <div className="relative">
              <input
                id={passwordId}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                aria-required="true"
                aria-invalid={errors.password ? 'true' : 'false'}
                aria-describedby={errors.password ? `${passwordId}-error` : undefined}
                {...register('password')}
                className={cn(
                  'h-12 w-full rounded-[var(--radius-md)] border pl-3.5 pr-12 text-base',
                  'bg-[var(--bg-surface)] text-[var(--text-primary)]',
                  'outline-none transition-all duration-[var(--transition-base)]',
                  'focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20',
                  errors.password
                    ? 'border-[var(--error-solid)] bg-[var(--error-bg)]'
                    : 'border-[var(--border-default)]',
                )}
              />
              <motion.button
                type="button"
                {...togglePasswordMotionProps}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-controls={passwordId}
                aria-pressed={showPassword}
                className={cn(
                  'absolute right-0 top-0 flex h-12 w-12 items-center justify-center',
                  'rounded-r-[var(--radius-md)] text-[var(--text-muted)]',
                  'hover:text-[var(--text-primary)] transition-colors',
                  'focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]',
                )}
              >
                {showPassword
                  ? <EyeOff size={18} aria-hidden="true" />
                  : <Eye    size={18} aria-hidden="true" />}
              </motion.button>
            </div>

            {errors.password && (
              <p
                id={`${passwordId}-error`}
                role="alert"
                className="mt-1.5 text-[12px] font-medium text-[var(--error-solid)]"
              >
                {errors.password.message}
              </p>
            )}
          </motion.div>

          {/* Remember me */}
          <motion.label
            {...fieldMotionProps(2)}
            className="flex cursor-pointer select-none items-center gap-2.5"
          >
            <input
              type="checkbox"
              {...register('rememberMe')}
              className={cn(
                'h-4 w-4 cursor-pointer rounded border-[var(--border-default)]',
                'accent-[var(--brand-primary)]',
                'focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]',
              )}
            />
            <span className="text-sm text-[var(--text-secondary)]">
              {t('rememberMe')}
            </span>
          </motion.label>

          {/* Submit */}
          <motion.div {...fieldMotionProps(3)}>
            <motion.button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              {...submitMotionProps}
              className={cn(
                'flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[var(--radius-md)]',
                'bg-[var(--brand-primary)] text-base font-bold text-white',
                'transition-colors duration-[var(--transition-base)]',
                'hover:bg-[var(--brand-primary-hover)]',
                'focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-70',
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                  <span>{t('signingIn')}</span>
                </>
              ) : (
                <span>{t('login')}</span>
              )}
            </motion.button>
          </motion.div>
        </form>
      </motion.div>

      {/* Language switcher */}
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-5 flex gap-2"
        role="navigation"
        aria-label="Language selection"
      >
        {LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => switchLocale(locale)}
            aria-label={`Switch to ${locale.toUpperCase()}`}
            aria-current={currentLocale === locale ? 'true' : undefined}
            className={cn(
              'min-h-[36px] rounded-md px-3 py-1.5 text-[13px] font-medium',
              'transition-colors duration-[var(--transition-fast)]',
              'focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]',
              currentLocale === locale
                ? 'bg-[var(--brand-primary)] text-white'
                : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]',
            )}
          >
            {LOCALE_LABELS[locale]}
          </button>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Animated error alert ─────────────────────────────────────────────────────

function AnimatedError({
  show,
  id,
  children,
}: {
  show: boolean;
  id: string;
  children: string;
}) {
  if (!show) return null;
  return (
    <motion.div
      id={id}
      role="alert"
      aria-live="assertive"
      initial={{ opacity: 0, y: -6, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -6, height: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'mb-4 overflow-hidden rounded-[var(--radius-md)]',
        'border border-[var(--error-border)] bg-[var(--error-bg)]',
        'px-4 py-3 text-sm font-medium text-[var(--error-text)]',
      )}
    >
      {children}
    </motion.div>
  );
}

// ─── Public export — page.tsx imports this ────────────────────────────────────

export function LoginClient({ redirectTo, initialError }: LoginClientProps) {
  return (
    <Suspense fallback={null}>
      <LoginForm redirectTo={redirectTo} initialError={initialError} />
    </Suspense>
  );
}