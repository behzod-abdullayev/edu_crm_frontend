'use client';

/**
 * ForgotPasswordClient — Client Component
 *
 * Framer Motion props follow the LoginClient.tsx pattern:
 *   exactOptionalPropertyTypes: true  →  never pass `prop={undefined}`.
 *   Instead, build motion-prop objects conditionally and spread them.
 *
 * Features:
 *  - React Hook Form + Zod validation
 *  - authApi.forgotPassword (swallows errors — anti-enumeration)
 *  - Dark/light mode via CSS variables
 *  - WCAG 2.1 AA compliant (ARIA roles, live regions)
 *  - Zero "any" TypeScript types
 *  - Zero hardcoded strings
 */

import { useState } from 'react';
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
import { ArrowLeft, Mail, Loader2, CheckCircle2, GraduationCap } from 'lucide-react';
import { authApi } from '@/services/api/auth.api';

// ─── i18n ─────────────────────────────────────────────────────────────────────

const STRINGS = {
  uz: {
    backToLogin: "Kirish sahifasiga qaytish",
    title: "Parolni unutdingizmi?",
    subtitle: "Email manzilingizni kiriting, biz sizga tiklash havolasini yuboramiz.",
    emailLabel: "Email manzil",
    emailPlaceholder: "sizning@email.com",
    emailRequired: "Email majburiy",
    emailInvalid: "Haqiqiy email manzil kiriting",
    submit: "Tiklash havolasini yuborish",
    submitting: "Yuborilmoqda…",
    successTitle: "Emailingizni tekshiring",
    successMessage: (email: string) =>
      `Agar ${email} uchun hisob mavjud bo'lsa, tez orada parol tiklash havolasi yuboriladi.`,
    backToLoginBtn: "Kirish sahifasiga qaytish",
  },
  en: {
    backToLogin: "Back to login",
    title: "Forgot your password?",
    subtitle: "Enter your email and we'll send you a reset link.",
    emailLabel: "Email address",
    emailPlaceholder: "you@example.com",
    emailRequired: "Email is required",
    emailInvalid: "Enter a valid email address",
    submit: "Send reset link",
    submitting: "Sending…",
    successTitle: "Check your email",
    successMessage: (email: string) =>
      `If an account exists for ${email}, you'll receive a password reset link shortly.`,
    backToLoginBtn: "Back to login",
  },
  ru: {
    backToLogin: "Вернуться к входу",
    title: "Забыли пароль?",
    subtitle: "Введите свой email, и мы отправим вам ссылку для сброса.",
    emailLabel: "Адрес электронной почты",
    emailPlaceholder: "ваш@email.com",
    emailRequired: "Email обязателен",
    emailInvalid: "Введите действительный адрес email",
    submit: "Отправить ссылку для сброса",
    submitting: "Отправка…",
    successTitle: "Проверьте почту",
    successMessage: (email: string) =>
      `Если учётная запись для ${email} существует, вы вскоре получите ссылку для сброса пароля.`,
    backToLoginBtn: "Вернуться к входу",
  },
} as const;

type Locale = keyof typeof STRINGS;

// ─── Zod schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  email: z.string().min(1, 'emailRequired').email('emailInvalid'),
});
type FormValues = z.infer<typeof schema>;

// ─── Animation variants ───────────────────────────────────────────────────────

const CARD_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } },
};

const FIELD_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.2 } }),
};

const SUCCESS_VARIANTS: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 22 } },
};

const SUBMIT_WHILE_TAP: TargetAndTransition = { scale: 0.97 };
const SUBMIT_WHILE_HOVER: TargetAndTransition = { scale: 1.01 };

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ForgotPasswordClientProps {
  locale: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ForgotPasswordClient({ locale }: ForgotPasswordClientProps) {
  const s = STRINGS[(locale as Locale) in STRINGS ? (locale as Locale) : 'en'];
  const shouldReduceMotion = useReducedMotion();

  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const getErrorMessage = (key: string | undefined): string | undefined => {
    if (key === 'emailRequired') return s.emailRequired;
    if (key === 'emailInvalid') return s.emailInvalid;
    return key;
  };

  async function onSubmit(values: FormValues) {
    try { await authApi.forgotPassword(values.email); } catch { /* anti-enumeration */ }
    setSubmittedEmail(values.email);
    setSubmitted(true);
  }

  const loginHref = `/${locale}/login`;

  // ── Build conditional motion props (exactOptionalPropertyTypes safe) ────────
  const cardMotionProps = shouldReduceMotion
    ? { initial: false as const, animate: 'visible' as const }
    : { variants: CARD_VARIANTS, initial: 'hidden' as const, animate: 'visible' as const };

  const fieldMotionProps = (i: number) =>
    shouldReduceMotion
      ? { initial: false as const, animate: 'visible' as const }
      : { variants: FIELD_VARIANTS, initial: 'hidden' as const, animate: 'visible' as const, custom: i };

  const successMotionProps = shouldReduceMotion
    ? { initial: false as const, animate: 'visible' as const }
    : { variants: SUCCESS_VARIANTS, initial: 'hidden' as const, animate: 'visible' as const };

  const iconMotionProps = shouldReduceMotion
    ? { initial: false as const, animate: { scale: 1, opacity: 1 } }
    : {
        initial: { scale: 0, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: 'spring' as const, stiffness: 280, damping: 20, delay: 0.1 },
      };

  const submitMotionProps = shouldReduceMotion
    ? {}
    : { whileHover: isSubmitting ? undefined : SUBMIT_WHILE_HOVER, whileTap: SUBMIT_WHILE_TAP };

  const backLinkMotionProps = shouldReduceMotion ? {} : { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } };

  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-4 py-8"
      style={{ background: 'var(--bg-page)' }}
    >
      <motion.main
        id="main-content"
        role="main"
        {...cardMotionProps}
        className="w-full max-w-[420px]"
      >
        <div
          className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-xl)] p-8"
          style={{ boxShadow: 'var(--shadow-xl)' }}
        >
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--brand-primary)' }}
              aria-hidden="true"
            >
              <GraduationCap size={24} className="text-white" />
            </div>
          </div>

          {!submitted ? (
            <>
              {/* Back link */}
              <Link
                href={loginHref}
                aria-label={s.backToLogin}
                className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors mb-6 min-h-[44px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded"
              >
                <ArrowLeft size={15} aria-hidden="true" />
                {s.backToLogin}
              </Link>

              {/* Header */}
              <motion.div {...fieldMotionProps(0)} className="mb-6">
                <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1.5">
                  {s.title}
                </h1>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                  {s.subtitle}
                </p>
              </motion.div>

              {/* Form */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                className="flex flex-col gap-5"
                aria-label={s.title}
              >
                {/* Email field */}
                <motion.div {...fieldMotionProps(1)}>
                  <label
                    htmlFor="fp-email"
                    className="block text-sm font-semibold text-[var(--text-primary)] mb-1.5"
                  >
                    {s.emailLabel}
                  </label>
                  <div className="relative">
                    <Mail
                      size={16}
                      aria-hidden="true"
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <input
                      id="fp-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder={s.emailPlaceholder}
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby={errors.email ? 'fp-email-error' : undefined}
                      aria-required="true"
                      {...register('email')}
                      className="w-full h-12 pl-10 pr-4 rounded-[var(--radius-md)] border text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] placeholder:text-[var(--text-muted)] outline-none transition-all duration-[var(--transition-base)]"
                      style={{
                        borderColor: errors.email ? 'var(--error-solid)' : 'var(--border-default)',
                        boxShadow: errors.email ? '0 0 0 3px rgba(239,68,68,0.1)' : undefined,
                      }}
                      onFocus={(e) => {
                        if (!errors.email) {
                          e.currentTarget.style.borderColor = 'var(--border-focus)';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(79,70,229,0.12)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.email) {
                          e.currentTarget.style.borderColor = 'var(--border-default)';
                          e.currentTarget.style.boxShadow = '';
                        }
                      }}
                    />
                  </div>
                  {errors.email && (
                    <motion.p
                      id="fp-email-error"
                      role="alert"
                      aria-live="polite"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1.5 text-xs text-[var(--error-solid)]"
                    >
                      {getErrorMessage(errors.email.message)}
                    </motion.p>
                  )}
                </motion.div>

                {/* Submit button */}
                <motion.div {...fieldMotionProps(2)}>
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    {...(submitMotionProps.whileTap !== undefined ? { whileTap: submitMotionProps.whileTap } : {})}
                    {...(submitMotionProps.whileHover !== undefined ? { whileHover: submitMotionProps.whileHover } : {})}
                    className="w-full h-12 flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-semibold text-base text-[var(--text-on-brand)] bg-[var(--brand-primary)] disabled:opacity-70 disabled:cursor-not-allowed transition-colors hover:bg-[var(--brand-primary-hover)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} aria-hidden="true" className="animate-spin" />
                        {s.submitting}
                      </>
                    ) : (
                      s.submit
                    )}
                  </motion.button>
                </motion.div>
              </form>
            </>
          ) : (
            /* Success state */
            <motion.div
              {...successMotionProps}
              className="flex flex-col items-center gap-4 text-center py-4"
              role="status"
              aria-live="polite"
            >
              <motion.div
                {...iconMotionProps}
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'var(--success-bg)', border: '2px solid var(--success-border)' }}
                aria-hidden="true"
              >
                <CheckCircle2 size={32} style={{ color: 'var(--success-solid)' }} />
              </motion.div>

              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                  {s.successTitle}
                </h2>
                <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-xs">
                  {s.successMessage(submittedEmail)}
                </p>
              </div>

              <motion.div
                {...backLinkMotionProps}
                className="mt-2"
              >
                <Link
                  href={loginHref}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-6 py-2.5 rounded-[var(--radius-md)] bg-[var(--brand-primary)] text-[var(--text-on-brand)] font-semibold text-sm hover:bg-[var(--brand-primary-hover)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2"
                >
                  {s.backToLoginBtn}
                </Link>
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.main>
    </div>
  );
}
