'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, useReducedMotion } from 'framer-motion';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

// ─── Schema ───────────────────────────────────────────────────────────────────

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormValues = z.infer<typeof resetSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ResetPasswordPage() {
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(resetSchema) });

  async function onSubmit(values: FormValues) {
    if (!token) {
      setServerError('Invalid or missing reset token.');
      return;
    }
    setServerError(null);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: values.password }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.replace('/login'), 3000);
        return;
      }

      const data = (await res.json()) as { message?: string };
      setServerError(data.message ?? 'Reset failed. The link may have expired.');
    } catch {
      setServerError('Network error. Please try again.');
    }
  }

  // Invalid token state
  if (!token) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          background: 'var(--bg-default)',
        }}
      >
        <div
          style={{
            maxWidth: 400,
            width: '100%',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl, 16px)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
            padding: '32px 28px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
          }}
          role="alert"
        >
          <AlertTriangle size={40} color="var(--color-error-solid, #dc2626)" aria-hidden="true" />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
            Invalid reset link
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
            This password reset link is invalid or has expired.
          </p>
          <Link
            href="/forgot-password"
            style={{
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
            Request a new link
          </Link>
        </div>
      </div>
    );
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
        {success ? (
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}
            role="status"
          >
            <CheckCircle2 size={48} color="var(--color-success-solid, #22c55e)" aria-hidden="true" />
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>
              Password reset!
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
              Your password has been updated. Redirecting to login…
            </p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                Set new password
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--text-muted)' }}>
                Choose a strong password for your account.
              </p>
            </div>

            {serverError && (
              <div
                role="alert"
                style={{
                  marginBottom: 16,
                  padding: '10px 14px',
                  background: 'var(--color-error-subtle, #fef2f2)',
                  border: '1px solid var(--color-error-border, #fecaca)',
                  borderRadius: 'var(--radius-md, 8px)',
                  fontSize: 14,
                  color: 'var(--color-error-solid, #dc2626)',
                }}
              >
                {serverError}
              </div>
            )}

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
            >
              {/* New password */}
              {([
                { id: 'password', label: 'New password', show: showPassword, toggle: () => setShowPassword((v) => !v), field: 'password' as const },
                { id: 'confirmPassword', label: 'Confirm password', show: showConfirm, toggle: () => setShowConfirm((v) => !v), field: 'confirmPassword' as const },
              ] as const).map(({ id, label, show, toggle, field }) => (
                <div key={id}>
                  <label
                    htmlFor={id}
                    style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}
                  >
                    {label}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id={id}
                      type={show ? 'text' : 'password'}
                      autoComplete={field === 'password' ? 'new-password' : 'new-password'}
                      aria-invalid={!!errors[field]}
                      aria-describedby={errors[field] ? `${id}-error` : undefined}
                      {...register(field)}
                      style={{
                        width: '100%',
                        height: 48,
                        padding: '0 52px 0 14px',
                        border: `1.5px solid ${errors[field] ? 'var(--color-error-solid, #dc2626)' : 'var(--border-default)'}`,
                        borderRadius: 'var(--radius-md, 8px)',
                        fontSize: 16,
                        color: 'var(--text-primary)',
                        background: 'var(--bg-surface)',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={toggle}
                      aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
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
                      {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                  {errors[field] && (
                    <p
                      id={`${id}-error`}
                      role="alert"
                      style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-error-solid, #dc2626)' }}
                    >
                      {errors[field]?.message}
                    </p>
                  )}
                </div>
              ))}

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
                  marginTop: 4,
                }}
              >
                {isSubmitting && <Loader2 size={18} aria-hidden="true" style={{ animation: 'spin 0.8s linear infinite' }} />}
                {isSubmitting ? 'Updating…' : 'Reset password'}
              </button>
            </form>
          </>
        )}
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
