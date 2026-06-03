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

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginSuccessResponse {
  user: { role: 'student' | 'teacher' | 'admin' | 'owner'; id: string; email: string; firstName: string; lastName: string; [key: string]: unknown };
  token: string;
}
interface ApiFieldError { field: keyof LoginFormValues; message: string; }
interface LoginErrorResponse { message?: string; errors?: ApiFieldError[]; }

const ROLE_DASHBOARD: Record<string, string> = {
  student: '/student/dashboard',
  teacher: '/teacher/dashboard',
  admin: '/admin/dashboard',
  owner: '/owner/dashboard',
};

// ─── Inner form — uses useSearchParams (must be inside Suspense) ──────────────
function LoginForm() {
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const setUser = useAuthStore((s) => s.setUser);
  const setTokens = useAuthStore((s) => s.setTokens);

  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: values.email, password: values.password, rememberMe: values.rememberMe }),
      });

      let data: LoginSuccessResponse & LoginErrorResponse;
      try {
        data = await res.json() as LoginSuccessResponse & LoginErrorResponse;
      } catch {
        setServerError(`Server error (${res.status}). Please try again.`);
        return;
      }

      if (res.ok) {
        if (data.user) {
          setUser(data.user as unknown as Parameters<typeof setUser>[0]);
          setTokens({ accessToken: data.token, refreshToken: '', expiresIn: values.rememberMe ? 604800 : 900 });
        }
        const redirectTo = searchParams?.get('redirect');
        const dashboard = ROLE_DASHBOARD[data.user?.role] ?? '/';
        router.replace(redirectTo && redirectTo !== '/' ? redirectTo : dashboard);
        return;
      }

      if (data.errors?.length) {
        data.errors.forEach(({ field, message }) => setError(field, { message }));
        return;
      }
      setServerError(data.message ?? 'Login failed. Please try again.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setServerError(`Network error: ${msg}`);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--bg-default)' }}>
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 350, damping: 30 }}
        style={{ width: '100%', maxWidth: 400, background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl, 16px)', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', padding: '32px 28px', border: '1px solid var(--border-default)' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div aria-hidden="true" style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--brand-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 22 }}>🎓</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Welcome back</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--text-muted)' }}>Sign in to your EduCRM account</p>
        </div>

        {serverError && (
          <div role="alert" style={{ marginBottom: 16, padding: '10px 14px', background: 'var(--color-error-subtle, #fef2f2)', border: '1px solid var(--color-error-border, #fecaca)', borderRadius: 'var(--radius-md, 8px)', fontSize: 14, color: 'var(--color-error-solid, #dc2626)' }}>
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Email</label>
            <input id="email" type="email" inputMode="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')}
              style={{ width: '100%', height: 48, padding: '0 14px', border: `1.5px solid ${errors.email ? 'var(--color-error-solid,#dc2626)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-md,8px)', fontSize: 16, color: 'var(--text-primary)', background: 'var(--bg-surface)', outline: 'none', boxSizing: 'border-box' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.email ? 'var(--color-error-solid,#dc2626)' : 'var(--border-default)'; }}
            />
            {errors.email && <p role="alert" style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-error-solid,#dc2626)' }}>{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label htmlFor="password" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Password</label>
              <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--brand-primary)', textDecoration: 'none' }}>Forgot password?</Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" aria-invalid={!!errors.password} {...register('password')}
                style={{ width: '100%', height: 48, padding: '0 52px 0 14px', border: `1.5px solid ${errors.password ? 'var(--color-error-solid,#dc2626)' : 'var(--border-default)'}`, borderRadius: 'var(--radius-md,8px)', fontSize: 16, color: 'var(--text-primary)', background: 'var(--bg-surface)', outline: 'none', boxSizing: 'border-box' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--brand-primary)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = errors.password ? 'var(--color-error-solid,#dc2626)' : 'var(--border-default)'; }}
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{ position: 'absolute', right: 0, top: 0, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p role="alert" style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-error-solid,#dc2626)' }}>{errors.password.message}</p>}
          </div>

          {/* Remember me */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', minHeight: 24 }}>
            <input type="checkbox" {...register('rememberMe')} style={{ width: 18, height: 18, accentColor: 'var(--brand-primary)', cursor: 'pointer' }} />
            <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Remember me</span>
          </label>

          {/* Submit */}
          <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}
            style={{ width: '100%', height: 52, background: isSubmitting ? 'var(--brand-primary-muted)' : 'var(--brand-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md,8px)', fontSize: 16, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: isSubmitting ? 0.8 : 1, marginTop: 4 }}>
            {isSubmitting && <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />}
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </motion.div>

      <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
        {['EN', 'RU', 'UZ'].map((lang) => (
          <button key={lang} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer', padding: '4px 8px', minHeight: 36 }}>{lang}</button>
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Page — wraps LoginForm in Suspense (required for useSearchParams) ────────
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-default)' }}>
        <Loader2 size={32} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--brand-primary)' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}