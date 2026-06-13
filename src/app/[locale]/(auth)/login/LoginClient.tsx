'use client';

/**
 * LoginClient — Client Component
 *
 * FIX TS2305: UserStatus ni @/shared/types dan emas,
 * @/services/api/auth.api dan import qilish kerak — u shu yerda ta'riflangan.
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
// FIX: UserStatus faqat auth.api da mavjud — @/shared/types da yo'q
import type { UserRole, UserStatus } from '@/services/api/auth.api';
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
    .min(1, 'emailRequired')
    .email('emailInvalid'),
  password: z
    .string()
    .min(1, 'passwordRequired')
    .min(6, 'passwordTooShort'),
  rememberMe: z.boolean().optional().default(false),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Animation variants ───────────────────────────────────────────────────────

const CARD_VARIANTS: Variants = {
  hidden:  { opacity: 0, scale: 0.96, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 320, damping: 28 },
  },
};

const LOGO_VARIANTS: Variants = {
  hidden:  { scale: 0.7, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 400, damping: 22 },
  },
};

const FIELD_VARIANTS: Variants = {
  hidden:  { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.2 },
  }),
};

const BUTTON_WHILE_TAP: TargetAndTransition  = { scale: 0.9  };
const SUBMIT_WHILE_TAP: TargetAndTransition  = { scale: 0.97 };
const SUBMIT_WHILE_HOVER: TargetAndTransition = { scale: 1.01 };

// ─── Props ────────────────────────────────────────────────────────────────────

export interface LoginClientProps {
  redirectTo:   string | undefined;
  initialError: string | undefined;
  locale:       string;
}

// ─── API response ─────────────────────────────────────────────────────────────

interface LoginApiResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    tenantId: string;
    profilePictureUrl: string | null;
    phone: string | null;
    preferredLanguage: string;
    twoFactorEnabled: boolean;
    teacherId: string | null;
    permissions: string[];
    [key: string]: unknown;
  };
  token: string;
}

// ─── Inner form ───────────────────────────────────────────────────────────────

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
      const res = await fetch('/api/auth/login', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({
          email:      values.email,
          password:   values.password,
          rememberMe: values.rememberMe,
        }),
      });

      if (!res.ok) {
        let errMsg = t('invalidCredentials');
        try {
          const errData = await res.json() as {
            message?: string;
            errors?: Record<string, string[]>;
          };
          if (errData.errors) {
            Object.entries(errData.errors).forEach(([field, messages]) => {
              if (field === 'email' || field === 'password') {
                const msg = messages[0];
                if (msg !== undefined) setError(field, { message: msg });
              }
            });
            return;
          }
          if (typeof errData.message === 'string') errMsg = errData.message;
        } catch {
          // JSON parse xatosi — default xabar
        }
        setServerError(errMsg);
        return;
      }

      const data = await res.json() as LoginApiResponse;

      const avatarSpread =
        data.user.profilePictureUrl !== null
          ? { avatarUrl: data.user.profilePictureUrl }
          : {};

      setUser({
        id:                data.user.id,
        email:             data.user.email,
        firstName:         data.user.firstName,
        lastName:          data.user.lastName,
        role:              data.user.role as UserRole,
        status:            data.user.status as UserStatus,
        permissions:       data.user.permissions,
        tenantId:          data.user.tenantId,
        profilePictureUrl: data.user.profilePictureUrl,
        phone:             data.user.phone,
        preferredLanguage: data.user.preferredLanguage,
        twoFactorEnabled:  data.user.twoFactorEnabled,
        teacherId:         data.user.teacherId,
        isActive:          data.user.status === 'active',
        ...avatarSpread,
      });

      setTokens({
        accessToken:  data.token,
        refreshToken: '',
        expiresIn:    values.rememberMe ? 604_800 : 900,
      });

      const redirectParam =
        redirectTo ??
        searchParams?.get('redirect') ??
        null;

      const defaultPath = ROLE_DASHBOARD[data.user.role] ?? '/student/dashboard';

      const targetPath =
        redirectParam &&
        redirectParam.startsWith('/') &&
        !redirectParam.startsWith('//')
          ? redirectParam
          : defaultPath;

      const finalUrl = `/${currentLocale}${targetPath}`;

      await new Promise((resolve) => setTimeout(resolve, 50));

      router.replace(finalUrl);
    } catch (err: unknown) {
      const parsed = parseApiError(err);
      setServerError(parsed.message ?? t('invalidCredentials'));
    }
  }

  // ── Locale switch ──────────────────────────────────────────────────────────
  function switchLocale(locale: string) {
    const path = window.location.pathname.replace(/^\/[a-z]{2}/, '');
    router.replace(`/${locale}${path}${window.location.search}`);
  }

  // ── Motion props ──────────────────────────────────────────────────────────

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

  function fieldMotionProps(index: number) {
    return shouldReduceMotion
      ? { initial: false as const, animate: 'visible' as const }
      : {
          custom:   index,
          variants: FIELD_VARIANTS,
          initial:  'hidden' as const,
          animate:  'visible' as const,
        };
  }

  const togglePasswordMotionProps = shouldReduceMotion ? {} : { whileTap: BUTTON_WHILE_TAP };
  const submitMotionProps = shouldReduceMotion ? {} : { whileHover: SUBMIT_WHILE_HOVER, whileTap: SUBMIT_WHILE_TAP };

  // ── Render ────────────────────────────────────────────────────────────────

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
              'mb-4 flex h-14 w-14 items-center justify-center rounded-2xl',
              'bg-[var(--brand-primary)] text-white shadow-lg',
            )}
          >
            <GraduationCap size={28} strokeWidth={2} />
          </motion.div>

          <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-[var(--text-primary)]">
            {t('loginTitle')}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--text-muted)]">
            {t('loginSubtitle')}
          </p>
        </div>

        {/* ── Server error ── */}
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
                {t(errors.email.message as Parameters<typeof t>[0], {
                  fallback: errors.email.message,
                })}
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
                aria-label={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
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
                {t(errors.password.message as Parameters<typeof t>[0], {
                  fallback: errors.password.message,
                })}
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
        aria-label="Til tanlash"
      >
        {LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => switchLocale(locale)}
            aria-label={`${locale.toUpperCase()} tiliga o'tish`}
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

// ─── Public export ─────────────────────────────────────────────────────────────

export function LoginClient({ redirectTo, initialError }: LoginClientProps) {
  return (
    <Suspense fallback={null}>
      <LoginForm redirectTo={redirectTo} initialError={initialError} />
    </Suspense>
  );
}
