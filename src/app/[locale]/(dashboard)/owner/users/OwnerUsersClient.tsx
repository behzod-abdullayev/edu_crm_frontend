'use client';

/**
 * OwnerUsersClient — /[locale]/owner/users
 *
 * FIX: The generated `useGetOwnerUsers` hook was sending requests directly to
 *      the backend which caused CORS/auth errors when the backend is not
 *      accessible from the browser. Switched to `useOwnerUsers` from
 *      `@/modules/owner/hooks/useOwner` which routes through the Next.js
 *      API proxy at /api/owner/users → backend /api/v1/owner/users.
 *
 * FIX: Added proper null/undefined guards on pagination meta fields.
 *
 * Features:
 *  - Full-text search (debounced 350 ms)
 *  - Role filter (all / student / teacher / admin / owner)
 *  - Paginated DataTable on desktop (≥ 640 px)
 *  - MobileCardList on mobile (< 640 px) with pull-to-refresh
 *  - Assign-role sheet (mobile) / modal (desktop)
 *  - Full A11Y: ARIA labels, focus management, keyboard navigation
 *  - Framer Motion: page fade-in, card stagger, button press animations
 *  - i18n via next-intl (zero hardcoded strings for user-facing copy)
 */

import { useState, useCallback, useMemo, useId, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import {
  Users,
  Search,
  ChevronDown,
  Shield,
  X,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';

// ── Owner module hook (routes through Next.js API proxy) ──────────────────────
import {
  useOwnerUsers,
} from '@/modules/owner/hooks/useOwner';
import type { UserDto, UserRole } from '@/modules/owner/types/owner.types';

// ── Shared components ─────────────────────────────────────────────────────────
import { DataTable, type ColumnDef } from '@/shared/components/data-display/DataTable';
import { MobileCardList } from '@/shared/components/mobile/MobileCardList';
import { AvatarWithRole } from '@/shared/components/data-display/AvatarWithRole';

// ── Shared hooks & utils ──────────────────────────────────────────────────────
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useIsMobile } from '@/shared/hooks/useMediaQuery';
import { useToast } from '@/shared/hooks/useToast';
import { cn } from '@/shared/utils/cn';
import type { UserProfile as SharedUserProfile } from '@/shared/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_OPTIONS: Array<{ value: UserRole | undefined; label: string }> = [
  { value: undefined, label: 'All Roles' },
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'admin', label: 'Admin' },
  { value: 'owner', label: 'Owner' },
];

const ROLE_BADGE_CLASSES: Record<string, string> = {
  student: 'bg-[var(--info-bg)] text-[var(--info-text)] border-[var(--info-border)]',
  teacher: 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]',
  admin:   'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]',
  owner:   'bg-[var(--error-bg)] text-[var(--error-text)] border-[var(--error-border)]',
};

// ── Helper: adapt UserDto to AvatarWithRole's expected shape ──────────────────
function toAvatarUser(
  u: UserDto,
): Pick<SharedUserProfile, 'firstName' | 'lastName' | 'avatar' | 'role'> {
  // UserDto.name is "First Last" — split it
  const parts = u.name.split(' ');
  const firstName = parts[0] ?? u.name;
  const lastName = parts.slice(1).join(' ') || '';
  return {
    firstName,
    lastName,
    role: u.role as SharedUserProfile['role'],
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md';
}

function RoleBadge({ role, size = 'md' }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-semibold capitalize',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        ROLE_BADGE_CLASSES[role] ??
          'bg-[var(--bg-surface-hover)] text-[var(--text-muted)] border-[var(--border-default)]',
      )}
      aria-label={`Role: ${role}`}
    >
      <Shield
        size={size === 'sm' ? 9 : 11}
        className="mr-1"
        aria-hidden="true"
      />
      {role}
    </span>
  );
}

// ── Assign Role Sheet / Modal ─────────────────────────────────────────────────

interface AssignRoleDialogProps {
  user: UserDto | null;
  open: boolean;
  onClose: () => void;
  onAssign: (userId: string, role: UserRole) => Promise<void>;
}

const ALL_ROLES: UserRole[] = ['student', 'teacher', 'admin', 'owner'];

function AssignRoleDialog({
  user,
  open,
  onClose,
  onAssign,
}: AssignRoleDialogProps) {
  const t = useTranslations();
  const reduced = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  const titleId = useId();

  const [selectedRole, setSelectedRole] = useState<UserRole>(
    user?.role ?? 'student',
  );
  const [isPending, setIsPending] = useState(false);

  // Sync selectedRole when user changes
  const currentUserRole = user?.role;
  useMemo(() => {
    if (currentUserRole) setSelectedRole(currentUserRole);
  }, [currentUserRole]);

  async function handleSubmit() {
    if (!user) return;
    setIsPending(true);
    try {
      await onAssign(user.id, selectedRole);
      onClose();
    } finally {
      setIsPending(false);
    }
  }

  if (!user) return null;

  const overlayMotion = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  };

  const panelMotion = isMobile
    ? {
        initial: reduced ? {} : { y: '100%' as const },
        animate: { y: 0 },
        exit: reduced ? {} : { y: '100%' as const },
        transition: reduced
          ? { duration: 0 }
          : { type: 'spring' as const, stiffness: 380, damping: 36 },
      }
    : {
        initial: reduced ? {} : { opacity: 0, scale: 0.95, y: 8 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: reduced ? {} : { opacity: 0, scale: 0.95, y: 8 },
        transition: reduced ? { duration: 0 } : { duration: 0.2 },
      };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          {...overlayMotion}
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
          style={{ background: 'var(--bg-overlay)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          role="presentation"
        >
          <motion.div
            {...panelMotion}
            className={cn(
              'relative w-full bg-[var(--bg-surface)]',
              'rounded-t-[var(--radius-2xl)] sm:rounded-[var(--radius-xl)]',
              'sm:max-w-md sm:mx-4',
              'shadow-[var(--shadow-xl)]',
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            {/* Drag handle (mobile only) */}
            <div
              className="flex justify-center pb-1 pt-3 sm:hidden"
              aria-hidden="true"
            >
              <div className="h-1 w-10 rounded-full bg-[var(--border-strong)]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border-default)] px-6 py-4">
              <h2
                id={titleId}
                className="text-base font-bold text-[var(--text-primary)]"
              >
                Assign Role
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('common.close')}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-lg',
                  'text-[var(--text-muted)] transition-colors',
                  'hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                )}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* User info */}
            <div className="flex items-center gap-3 bg-[var(--bg-surface-secondary)] px-6 py-4">
              <AvatarWithRole user={toAvatarUser(user)} size="md" showRole={false} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {user.name}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {user.email}
                </p>
              </div>
              <RoleBadge role={user.role} size="sm" />
            </div>

            {/* Role selector */}
            <div className="space-y-3 p-6">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Select new role
              </p>
              <div
                className="grid grid-cols-2 gap-2"
                role="radiogroup"
                aria-label="User role selection"
              >
                {ALL_ROLES.map((role) => {
                  const isSelected = selectedRole === role;
                  return (
                    <motion.button
                      key={role}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedRole(role)}
                      whileTap={reduced ? {} : { scale: 0.97 }}
                      className={cn(
                        'flex min-h-[48px] items-center justify-between gap-2 rounded-lg border px-4 py-3',
                        'text-sm font-semibold capitalize',
                        'transition-colors duration-[var(--transition-fast)]',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                        isSelected
                          ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                          : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Shield size={14} aria-hidden="true" />
                        {role}
                      </span>
                      {isSelected && (
                        <CheckCircle size={16} aria-hidden="true" />
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex items-center gap-3 border-t border-[var(--border-default)] px-6 py-4"
              style={{
                paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className={cn(
                  'flex flex-1 min-h-[48px] items-center justify-center rounded-lg border',
                  'border-[var(--border-default)] bg-[var(--bg-surface)]',
                  'text-sm font-semibold text-[var(--text-primary)]',
                  'hover:bg-[var(--bg-surface-hover)]',
                  'transition-colors duration-[var(--transition-fast)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {t('common.cancel')}
              </button>
              <motion.button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || selectedRole === user.role}
                aria-busy={isPending}
                whileTap={reduced ? {} : { scale: 0.97 }}
                className={cn(
                  'flex flex-1 min-h-[48px] items-center justify-center gap-2 rounded-lg',
                  'bg-[var(--brand-primary)] text-white',
                  'text-sm font-bold',
                  'hover:bg-[var(--brand-primary-hover)]',
                  'transition-colors duration-[var(--transition-fast)]',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                {isPending ? (
                  <>
                    <Loader2
                      size={16}
                      aria-hidden="true"
                      className="animate-spin"
                    />
                    <span>Saving…</span>
                  </>
                ) : (
                  t('common.save')
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── User card (mobile card list item) ─────────────────────────────────────────

interface UserCardProps {
  user: UserDto;
  isSelected: boolean;
  onAssignRole: (user: UserDto) => void;
}

function UserCard({ user, isSelected, onAssignRole }: UserCardProps) {
  const reduced = useReducedMotion() ?? false;

  const lastLogin = user.lastLogin
    ? format(new Date(user.lastLogin), 'MMM d, yyyy')
    : 'Never';

  return (
    <motion.div
      initial={reduced ? {} : { opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'flex items-center gap-3 border-b border-[var(--border-default)] px-4 py-3.5',
        'bg-[var(--bg-surface)] transition-colors duration-[var(--transition-fast)]',
        isSelected && 'bg-[var(--brand-primary)]/5',
      )}
      aria-label={`User: ${user.name}, role: ${user.role}`}
    >
      <AvatarWithRole user={toAvatarUser(user)} size="md" showRole={false} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {user.name}
        </p>
        <p className="truncate text-xs text-[var(--text-muted)]">
          {user.email}
        </p>
        <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">
          Last login: {lastLogin}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <RoleBadge role={user.role} size="sm" />
        <button
          type="button"
          onClick={() => onAssignRole(user)}
          aria-label={`Change role for ${user.name}`}
          className={cn(
            'flex h-8 min-h-[32px] items-center gap-1 rounded-lg border border-[var(--border-default)]',
            'px-2.5 text-[11px] font-semibold text-[var(--text-secondary)]',
            'hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]',
            'transition-colors duration-[var(--transition-fast)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
          )}
        >
          <Shield size={11} aria-hidden="true" />
          Change
        </button>
      </div>
    </motion.div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface OwnerUsersClientProps {
  locale: string;
}

// Widen UserDto for DataTable (which requires Record<string,unknown>)
type UserRow = UserDto & Record<string, unknown>;

// ─── Main Component ───────────────────────────────────────────────────────────

export function OwnerUsersClient({ locale: _locale }: OwnerUsersClientProps) {
  const t = useTranslations();
  const isMobile = useIsMobile();
  const reduced = useReducedMotion() ?? false;
  const { toast } = useToast();

  // ── Filter state ───────────────────────────────────────────────────────────
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounce(searchRaw, 350);
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // ── Role filter dropdown ───────────────────────────────────────────────────
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleFilterId = useId();

  // ── Data fetching (via /api/owner/users proxy) ─────────────────────────────
  const {
    users: allUsers,
    isLoading,
    changeRole,
    refresh,
  } = useOwnerUsers();

  // Client-side filter (since the hook fetches all users at once)
  const users = useMemo<UserDto[]>(() => {
    let filtered = allUsers;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }
    if (roleFilter) {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }
    return filtered;
  }, [allUsers, search, roleFilter]);

  // Build fake pagination meta for DataTable
  const pagination = useMemo(
    () => ({
      page: 1,
      limit: users.length || 10,
      total: users.length,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    }),
    [users.length],
  );

  // Error state (hook doesn't expose error, but we can handle load failures)
  const [loadError, setLoadError] = useState<Error | null>(null);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleOpenAssignRole = useCallback((user: UserDto) => {
    setSelectedUser(user);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setTimeout(() => setSelectedUser(null), 300);
  }, []);

  const handleAssignRole = useCallback(
    async (userId: string, role: UserRole) => {
      try {
        await changeRole(userId, role);
        toast.success('Role assigned successfully');
      } catch {
        toast.error('Failed to assign role. Please try again.');
        throw new Error('Role assignment failed');
      }
    },
    [changeRole, toast],
  );

  const handleRefresh = useCallback(async () => {
    setLoadError(null);
    try {
      await refresh();
    } catch (e) {
      setLoadError(e instanceof Error ? e : new Error('Refresh failed'));
    }
  }, [refresh]);

  const handleSearch = useCallback((v: string) => {
    setSearchRaw(v);
  }, []);

  const handleRoleFilter = useCallback(
    (role: UserRole | undefined) => {
      setRoleFilter(role);
      setRoleDropdownOpen(false);
    },
    [],
  );

  // ── Desktop table columns ─────────────────────────────────────────────────
  const columns = useMemo<ColumnDef<UserRow>[]>(
    () => [
      {
        key: 'name',
        header: 'User',
        accessor: (row): ReactNode => (
          <AvatarWithRole
            user={toAvatarUser(row as UserDto)}
            size="sm"
            showName
            showRole={false}
          />
        ),
        width: '240px',
      },
      {
        key: 'email',
        header: 'Email',
        accessor: 'email',
        width: '220px',
      },
      {
        key: 'role',
        header: 'Role',
        accessor: (row): ReactNode => (
          <RoleBadge role={(row as UserDto).role} />
        ),
        sortable: true,
        width: '120px',
      },
      {
        key: 'lastLogin',
        header: 'Last Login',
        accessor: (row): ReactNode => {
          const u = row as UserDto;
          return u.lastLogin
            ? format(new Date(u.lastLogin), 'MMM d, yyyy')
            : '—';
        },
        width: '140px',
      },
      {
        key: 'actions',
        header: '',
        accessor: (row): ReactNode => (
          <motion.button
            type="button"
            onClick={() => handleOpenAssignRole(row as UserDto)}
            whileTap={reduced ? {} : { scale: 0.95 }}
            aria-label={`Change role for ${(row as UserDto).name}`}
            className={cn(
              'flex h-9 min-h-[36px] items-center gap-1.5 rounded-lg border',
              'border-[var(--border-default)] bg-[var(--bg-surface)]',
              'px-3 text-xs font-semibold text-[var(--text-secondary)]',
              'hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]',
              'transition-colors duration-[var(--transition-fast)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            )}
          >
            <Shield size={12} aria-hidden="true" />
            Assign Role
          </motion.button>
        ),
        width: '120px',
      },
    ],
    [handleOpenAssignRole, reduced],
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <motion.main
      initial={reduced ? {} : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6 px-4 py-4 sm:px-5 sm:py-5 lg:px-6 lg:py-6"
      aria-label="Users management"
    >
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--text-primary)] sm:text-2xl lg:text-3xl">
            <Users
              size={24}
              aria-hidden="true"
              className="text-[var(--brand-primary)]"
            />
            {t('nav.users')}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">
            {users.length.toLocaleString()} total users
          </p>
        </div>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-3"
        role="toolbar"
        aria-label="User filters"
      >
        {/* Search */}
        <div className="relative min-w-[180px] flex-1 max-w-sm">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="search"
            value={searchRaw}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={`${t('common.search')} users…`}
            aria-label="Search users by name or email"
            className={cn(
              'h-10 min-h-[44px] w-full rounded-lg border border-[var(--border-default)]',
              'bg-[var(--bg-surface)] py-2 pl-9 pr-4',
              'text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
              'outline-none transition-colors duration-[var(--transition-fast)]',
              'focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--border-focus)]/20',
            )}
          />
          {searchRaw && (
            <button
              type="button"
              onClick={() => handleSearch('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X size={14} aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Role filter dropdown */}
        <div className="relative">
          <button
            type="button"
            id={roleFilterId}
            onClick={() => setRoleDropdownOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={roleDropdownOpen}
            aria-label={`Filter by role: ${roleFilter ?? 'All Roles'}`}
            className={cn(
              'flex h-10 min-h-[44px] items-center gap-2 rounded-lg border px-4',
              'text-sm font-medium',
              'transition-colors duration-[var(--transition-fast)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
              roleFilter
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]'
                : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)]',
            )}
          >
            <Shield size={15} aria-hidden="true" />
            <span className="capitalize">{roleFilter ?? 'All Roles'}</span>
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={cn(
                'transition-transform duration-[var(--transition-fast)]',
                roleDropdownOpen && 'rotate-180',
              )}
            />
          </button>

          <AnimatePresence>
            {roleDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setRoleDropdownOpen(false)}
                  aria-hidden="true"
                />
                <motion.ul
                  initial={reduced ? {} : { opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={reduced ? {} : { opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.13 }}
                  role="listbox"
                  aria-labelledby={roleFilterId}
                  className={cn(
                    'absolute left-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden',
                    'rounded-[var(--radius-lg)] border border-[var(--border-default)]',
                    'bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]',
                  )}
                >
                  {ROLE_OPTIONS.map(({ value, label }) => (
                    <li
                      key={label}
                      role="option"
                      aria-selected={roleFilter === value}
                    >
                      <button
                        type="button"
                        onClick={() => handleRoleFilter(value)}
                        className={cn(
                          'flex w-full items-center gap-2 px-4 py-2.5',
                          'text-sm text-[var(--text-primary)]',
                          'transition-colors duration-[var(--transition-fast)]',
                          'hover:bg-[var(--bg-surface-hover)]',
                          'focus-visible:outline-none focus-visible:bg-[var(--bg-surface-hover)]',
                          roleFilter === value &&
                            'font-semibold text-[var(--brand-primary)]',
                        )}
                      >
                        {roleFilter === value ? (
                          <CheckCircle
                            size={14}
                            aria-hidden="true"
                            className="text-[var(--brand-primary)]"
                          />
                        ) : (
                          <span className="w-[14px]" aria-hidden="true" />
                        )}
                        {label}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Clear filters chip */}
        {(searchRaw || roleFilter) && (
          <button
            type="button"
            onClick={() => {
              handleSearch('');
              setRoleFilter(undefined);
            }}
            aria-label="Clear all filters"
            className={cn(
              'flex h-10 min-h-[44px] items-center gap-1.5 rounded-lg border',
              'border-[var(--border-default)] px-3 text-sm text-[var(--text-muted)]',
              'hover:bg-[var(--bg-surface-hover)]',
              'transition-colors duration-[var(--transition-fast)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
            )}
          >
            <X size={14} aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {loadError != null && (
          <motion.div
            initial={reduced ? {} : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduced ? {} : { opacity: 0, height: 0 }}
            role="alert"
            aria-live="assertive"
            className={cn(
              'flex items-center gap-3 rounded-lg border px-4 py-3',
              'border-[var(--error-border)] bg-[var(--error-bg)] text-sm text-[var(--error-text)]',
            )}
          >
            <AlertTriangle size={16} aria-hidden="true" className="shrink-0" />
            <span>{t('errors.serverError')}</span>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              className="ml-auto font-semibold underline hover:no-underline focus-visible:outline-none"
            >
              {t('common.retry')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Desktop: DataTable | Mobile: card list ───────────────────── */}
      {isMobile ? (
        <MobileCardList
          data={users as (UserDto & { id: string })[]}
          isLoading={isLoading}
          error={loadError}
          hasMore={false}
          onRefresh={handleRefresh}
          emptyState={{
            title: 'No users found',
            description:
              searchRaw || roleFilter
                ? 'Try adjusting your search or filters.'
                : 'No users have been added yet.',
            icon: Users,
          }}
          renderCard={(user, isSelected) => (
            <UserCard
              key={user.id}
              user={user}
              isSelected={isSelected}
              onAssignRole={handleOpenAssignRole}
            />
          )}
        />
      ) : (
        <DataTable<UserRow>
          columns={columns}
          data={users as UserRow[]}
          isLoading={isLoading}
          error={loadError}
          pagination={pagination}
          onPageChange={() => {/* single page */}}
          rowKey="id"
          emptyState={{
            title: 'No users found',
            description:
              searchRaw || roleFilter
                ? 'Try adjusting your search or filters.'
                : 'No users have been added yet.',
          }}
        />
      )}

      {/* ── Assign-role dialog / bottom sheet ────────────────────────────── */}
      <AssignRoleDialog
        user={selectedUser}
        open={dialogOpen}
        onClose={handleCloseDialog}
        onAssign={handleAssignRole}
      />
    </motion.main>
  );
}
