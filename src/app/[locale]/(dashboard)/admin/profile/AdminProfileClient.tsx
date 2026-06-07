'use client';

/**
 * src/app/[locale]/(dashboard)/admin/profile/AdminProfileClient.tsx
 *
 * FIX TS2352: `UserProfile | undefined` ni `Record<string, unknown>` ga
 * cast qilish noto'g'ri edi. UserProfile-da `phone` va `createdAt` fieldlari
 * to'g'ridan-to'g'ri mavjud (@/services/api/auth.api) — cast kerak emas.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Shield, Mail, Phone, Calendar } from 'lucide-react';
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { ChangePasswordForm } from '@/shared/components/ChangePasswordForm';
import { AvatarWithRole } from '@/shared/components/data-display/AvatarWithRole';
import { cn } from '@/shared/utils/cn';
import { format } from 'date-fns';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ─── Animation variants ───────────────────────────────────────────────────────

const panelVariants = {
  hidden:  { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
};

// ─── Info row ─────────────────────────────────────────────────────────────────

interface InfoRowProps {
  icon:  React.ElementType;
  label: string;
  value: string | null | undefined;
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--border-default)] last:border-0">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: 'var(--bg-surface-secondary)' }}
      >
        <Icon size={16} className="text-[var(--text-muted)]" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[var(--text-muted)] font-medium">{label}</p>
        <p className="text-sm text-[var(--text-primary)] font-medium truncate mt-0.5">
          {value ?? '—'}
        </p>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminProfileClient() {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6 max-w-2xl px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6"
    >
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
          My Profile
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Manage your account information and security settings.
        </p>
      </div>

      {/* ── Avatar + name card ── */}
      {user && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, duration: 0.25 }}
          className="flex items-center gap-4 p-5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)]"
          style={{ boxShadow: 'var(--shadow-sm)' }}
        >
          <AvatarWithRole user={user} size="lg" showRole />
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-[var(--text-primary)] leading-tight">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{user.email}</p>
            <span
              className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
              style={{ background: 'var(--role-admin)' }}
            >
              <Shield size={11} aria-hidden="true" />
              Admin
            </span>
          </div>
        </motion.div>
      )}

      {/* ── Tab bar ── */}
      <nav
        role="tablist"
        aria-label="Profile sections"
        className="flex gap-1 border-b border-[var(--border-default)] relative"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              role="tab"
              type="button"
              id={`tab-${id}`}
              aria-selected={isActive}
              aria-controls={`panel-${id}`}
              onClick={() => setActiveTab(id)}
              className={cn(
                'relative flex items-center gap-2 px-4 pb-3 pt-1 text-sm font-medium',
                'transition-colors duration-150 focus-visible:outline-none',
                'focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
                isActive
                  ? 'text-[var(--brand-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
              )}
            >
              <Icon
                size={14}
                aria-hidden="true"
                className={isActive ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'}
              />
              {label}

              {isActive && (
                <motion.span
                  layoutId="admin-profile-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[var(--brand-primary)]"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Tab panels ── */}
      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            id="panel-profile"
            role="tabpanel"
            aria-labelledby="tab-profile"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface)] overflow-hidden"
            style={{ boxShadow: 'var(--shadow-sm)' }}
          >
            <div
              className="px-5 py-3.5 border-b border-[var(--border-default)]"
              style={{ background: 'var(--bg-surface-secondary)' }}
            >
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Account Information
              </h3>
            </div>
            <div className="px-5 py-1">
              {/* FIX: UserProfile fieldlariga to'g'ridan-to'g'ri murojaat — cast kerak emas */}
              <InfoRow
                icon={User}
                label="Full Name"
                value={user ? `${user.firstName} ${user.lastName}` : undefined}
              />
              <InfoRow
                icon={Mail}
                label="Email Address"
                value={user?.email}
              />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={user?.phone}
              />
              <InfoRow
                icon={Calendar}
                label="Member Since"
                value={
                  user?.createdAt
                    ? format(new Date(user.createdAt), 'MMMM d, yyyy')
                    : undefined
                }
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'password' && (
          <motion.div
            key="password"
            id="panel-password"
            role="tabpanel"
            aria-labelledby="tab-password"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ChangePasswordForm userId={user?.id ?? ''} role="admin" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
