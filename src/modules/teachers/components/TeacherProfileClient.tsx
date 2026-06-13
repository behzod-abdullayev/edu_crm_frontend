'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock } from 'lucide-react';
import { useCurrentUser } from '@shared/hooks/useCurrentUser';
import { TeacherProfileForm } from './TeacherProfileForm';
import { ChangePasswordForm } from '@shared/components/ChangePasswordForm';
import { cn } from '@shared/utils/cn';

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ─── Animation variants ───────────────────────────────────────────────────────

const panelVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15, ease: 'easeIn' },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function TeacherProfileClient() {
  // ✅ FIX: use `user` (UserProfile | undefined), NOT `data` (any).
  // The hook exposes both: `data: any` (raw query result) and
  // `user: UserProfile | undefined` (typed). Always use the typed field.
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<TabId>('profile');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="space-y-6 max-w-2xl"
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
                className={
                  isActive ? 'text-[var(--brand-primary)]' : 'text-[var(--text-muted)]'
                }
              />
              {label}

              {/* Animated active underline indicator */}
              {isActive && (
                <motion.span
                  layoutId="teacher-profile-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-primary)] rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
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
            role="tabpanel"
            id="panel-profile"
            aria-labelledby="tab-profile"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <TeacherProfileForm teacherId={user?.teacherId ?? ''} />
          </motion.div>
        )}

        {activeTab === 'password' && (
          <motion.div
            key="password"
            role="tabpanel"
            id="panel-password"
            aria-labelledby="tab-password"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ChangePasswordForm userId={user?.id ?? ''} role="teacher" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}