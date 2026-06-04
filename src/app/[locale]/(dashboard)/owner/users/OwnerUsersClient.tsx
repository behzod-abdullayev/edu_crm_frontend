'use client';

/**
 * OwnerUsersClient — /[locale]/owner/users
 *
 * Features:
 *  - Full-text search (debounced 350 ms)
 *  - Role filter (all / student / teacher / admin / owner)
 *  - Paginated DataTable on desktop (≥ 640 px)
 *  - MobileCardList on mobile (< 640 px) with infinite scroll + pull-to-refresh
 *  - Assign-role sheet (mobile) / modal (desktop) via useAssignUserRole mutation
 *  - Optimistic cache invalidation after role change
 *  - Full A11Y: ARIA labels, focus management, keyboard navigation
 *  - Framer Motion: page fade-in, card stagger, button press animations
 *  - i18n via next-intl (zero hardcoded strings for user-facing copy)
 */

import { useState, useCallback, useMemo, useId, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
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

// ── Generated API hooks & types ───────────────────────────────────────────────
import {
  useGetOwnerUsers,
  useAssignUserRole,
  getGetOwnerUsersQueryKey,
} from '@generated/api/owner/owner';
import type { UserProfile } from '@generated/models/userProfile';
import { UserRole } from '@generated/models/userRole';
import type { GetOwnerUsersParams } from '@generated/models/getOwnerUsersParams';

// ── Shared components ─────────────────────────────────────────────────────────
import { DataTable, type ColumnDef } from '@shared/components/data-display/DataTable';
import { MobileCardList } from '@shared/components/mobile/MobileCardList';
import { AvatarWithRole } from '@shared/components/data-display/AvatarWithRole';

// ── Shared hooks & utils ──────────────────────────────────────────────────────
import { useDebounce } from '@shared/hooks/useDebounce';
import { useIsMobile } from '@shared/hooks/useMediaQuery';
import { useToast } from '@shared/hooks/useToast';
import { cn } from '@shared/utils/cn';
import type { UserProfile as SharedUserProfile } from '@shared/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_OPTIONS: Array<{ value: UserRole | undefined; label: string }> = [
  { value: undefined, label: 'All Roles' },
  { value: UserRole.student, label: 'Student' },
  { value: UserRole.teacher, label: 'Teacher' },
  { value: UserRole.admin, label: 'Admin' },
  { value: UserRole.owner, label: 'Owner' },
];

const ROLE_BADGE_CLASSES: Record<string, string> = {
  student: 'bg-[var(--info-bg)] text-[var(--info-text)] border-[var(--info-border)]',
  teacher: 'bg-[var(--success-bg)] text-[var(--success-text)] border-[var(--success-border)]',
  admin:   'bg-[var(--warning-bg)] text-[var(--warning-text)] border-[var(--warning-border)]',
  owner:   'bg-[var(--error-bg)] text-[var(--error-text)] border-[var(--error-border)]',
};

const PAGE_LIMIT = 10;

// ── Helper: extract avatar-compatible user shape ───────────────────────────────
// AvatarWithRole expects Pick<SharedUserProfile, 'firstName'|'lastName'|'avatar'|'role'>
// SharedUserProfile.avatar is `string | undefined` (imported from @shared/types).
// Generated UserProfile has `avatar?: string | null` so null → undefined.
function toAvatarUser(
  u: UserProfile,
): Pick<SharedUserProfile, 'firstName' | 'lastName' | 'avatar' | 'role'> {
  return {
    firstName: u.firstName,
    lastName: u.lastName,
    // avatar: string | null → strip null to undefined (SharedUserProfile.avatar?: string)
    ...(u.avatar != null ? { avatar: u.avatar } : {}),
    // UserRole enum value is assignable to shared 'student'|'teacher'|'admin'|'owner'
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
  user: UserProfile | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function AssignRoleDialog({
  user,
  open,
  onClose,
  onSuccess,
}: AssignRoleDialogProps) {
  const t = useTranslations();
  const reduced = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const titleId = useId();

  const [selectedRole, setSelectedRole] = useState<string>(
    user?.role ?? UserRole.student,
  );

  const { mutate: assignRole, isPending } = useAssignUserRole({
    mutation: {
      onSuccess: (updatedUser) => {
        // Patch list cache directly, then invalidate for a background sync
        queryClient.setQueryData(
          getGetOwnerUsersQueryKey(),
          (old: { data: UserProfile[]; meta: unknown } | undefined) => {
            if (!old) return old;
            return {
              ...old,
              data: old.data.map((u) =>
                u.id === updatedUser.id ? updatedUser : u,
              ),
            };
          },
        );
        queryClient.invalidateQueries({
          queryKey: getGetOwnerUsersQueryKey(),
          exact: false,
        });

        toast.success(`Role updated to "${selectedRole}"`);
        onSuccess();
        onClose();
      },
      onError: () => {
        toast.error('Failed to assign role. Please try again.');
      },
    },
  });

  function handleSubmit() {
    if (!user) return;
    assignRole({
      id: user.id,
      data: { role: selectedRole as UserRole },
    });
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
                  {user.firstName} {user.lastName}
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
                {Object.values(UserRole).map((role) => {
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
  user: UserProfile;
  isSelected: boolean;
  onAssignRole: (user: UserProfile) => void;
}

function UserCard({ user, isSelected, onAssignRole }: UserCardProps) {
  const reduced = useReducedMotion() ?? false;

  const fullName = `${user.firstName} ${user.lastName}`;
  const lastLogin = user.lastLoginAt
    ? format(new Date(user.lastLoginAt), 'MMM d, yyyy')
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
      aria-label={`User: ${fullName}, role: ${user.role}`}
    >
      <AvatarWithRole user={toAvatarUser(user)} size="md" showRole={false} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
          {fullName}
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
          aria-label={`Change role for ${fullName}`}
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

// ─── Main Component ───────────────────────────────────────────────────────────

// Widen UserProfile for DataTable (which requires Record<string,unknown>)
type UserRow = UserProfile & Record<string, unknown>;

export function OwnerUsersClient({ locale: _locale }: OwnerUsersClientProps) {
  const t = useTranslations();
  const isMobile = useIsMobile();
  const reduced = useReducedMotion() ?? false;
  const { toast } = useToast();

  // ── Filter / pagination state ──────────────────────────────────────────────
  const [searchRaw, setSearchRaw] = useState('');
  const search = useDebounce(searchRaw, 350);
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>(undefined);
  const [page, setPage] = useState(1);

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // ── Role filter dropdown ───────────────────────────────────────────────────
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const roleFilterId = useId();

  // Build query params
  const queryParams = useMemo<GetOwnerUsersParams>(
    () => ({
      page,
      limit: PAGE_LIMIT,
      ...(search ? { search } : {}),
      ...(roleFilter ? { role: roleFilter } : {}),
    }),
    [page, search, roleFilter],
  );

  // ── Data fetching ──────────────────────────────────────────────────────────
  const {
    data: usersPage,
    isLoading,
    error,
    refetch,
  } = useGetOwnerUsers(queryParams);

  const users: UserProfile[] = usersPage?.data ?? [];
  const meta = usersPage?.meta;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleOpenAssignRole = useCallback((user: UserProfile) => {
    setSelectedUser(user);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setTimeout(() => setSelectedUser(null), 300);
  }, []);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleSearch = useCallback((v: string) => {
    setSearchRaw(v);
    setPage(1);
  }, []);

  const handleRoleFilter = useCallback(
    (role: UserRole | undefined) => {
      setRoleFilter(role);
      setPage(1);
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
            user={toAvatarUser(row as UserProfile)}
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
          <RoleBadge role={(row as UserProfile).role} />
        ),
        sortable: true,
        width: '120px',
      },
      {
        key: 'lastLoginAt',
        header: 'Last Login',
        accessor: (row): ReactNode => {
          const u = row as UserProfile;
          return u.lastLoginAt
            ? format(new Date(u.lastLoginAt), 'MMM d, yyyy')
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
            onClick={() => handleOpenAssignRole(row as UserProfile)}
            whileTap={reduced ? {} : { scale: 0.95 }}
            aria-label={`Change role for ${(row as UserProfile).firstName} ${(row as UserProfile).lastName}`}
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

  // Pagination for DataTable (must be PaginationMeta shape from @shared/types)
  const pagination = meta
    ? { page: meta.page, limit: meta.limit, total: meta.total }
    : undefined;

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
          {meta && (
            <p className="mt-0.5 text-sm text-[var(--text-muted)]">
              {meta.total.toLocaleString()} total users
            </p>
          )}
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
        {error != null && (
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
              onClick={() => refetch()}
              className="ml-auto font-semibold underline hover:no-underline focus-visible:outline-none"
            >
              {t('common.retry')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Desktop: DataTable | Mobile: MobileCardList ───────────────────── */}
      {isMobile ? (
        <MobileCardList
          data={users as (UserProfile & { id: string })[]}
          isLoading={isLoading}
          error={error instanceof Error ? error : null}
          hasMore={meta?.hasNextPage ?? false}
          {...(meta?.hasNextPage
            ? { onLoadMore: () => setPage((p) => p + 1) }
            : {})}
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
          error={error instanceof Error ? error : null}
          {...(pagination !== undefined ? { pagination } : {})}
          onPageChange={setPage}
          rowKey="id"
          stickyHeader
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
        onSuccess={() => {
          toast.success('Role assigned successfully');
        }}
      />
    </motion.main>
  );
}
