'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

// export const metadata: Metadata = {
//   title: 'Forgot Password | EduCRM',
//   robots: { index: false, follow: false },
// };

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const shouldReduceMotion = useReducedMotion();
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: values.email }),
    });
    // Always show success to avoid email enumeration
    setSubmittedEmail(values.email);
    setSubmitted(true);
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'var(--bg-default)',
      }}
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 30 }}
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl, 16px)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          padding: '32px 28px',
          border: '1px solid var(--border-default)',
        }}
      >
        <Link
          href="/login"
          aria-label="Back to login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            fontSize: 14,
            marginBottom: 24,
            minHeight: 44,
          }}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to login
        </Link>

        {!submitted ? (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                Forgot password?
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              <div>
                <label
                  htmlFor="email"
                  style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}
                >
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  {...register('email')}
                  style={{
                    width: '100%',
                    height: 48,
                    padding: '0 14px',
                    border: `1.5px solid ${errors.email ? 'var(--color-error-solid, #dc2626)' : 'var(--border-default)'}`,
                    borderRadius: 'var(--radius-md, 8px)',
                    fontSize: 16,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-surface)',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                {errors.email && (
                  <p
                    id="email-error"
                    role="alert"
                    style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-error-solid, #dc2626)' }}
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
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
                  opacity: isSubmitting ? 0.8 : 1,
                }}
              >
                {isSubmitting && <Loader2 size={18} aria-hidden="true" style={{ animation: 'spin 0.8s linear infinite' }} />}
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        ) : (
          /* Success state */
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}
            role="status"
          >
            <CheckCircle2 size={48} color="var(--color-success-solid, #22c55e)" aria-hidden="true" />
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              Check your email
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              If an account exists for <strong>{submittedEmail}</strong>, you&apos;ll receive a password reset link shortly.
            </p>
            <Link
              href="/login"
              style={{
                marginTop: 8,
                padding: '10px 24px',
                minHeight: 44,
                display: 'inline-flex',
                alignItems: 'center',
                background: 'var(--brand-primary)',
                color: '#fff',
                borderRadius: 'var(--radius-md, 8px)',
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Back to login
            </Link>
          </div>
        )}
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
