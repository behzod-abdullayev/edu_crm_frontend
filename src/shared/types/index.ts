// ─── Domain types ─────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'teacher' | 'admin' | 'owner';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

// ─── Pagination / Sort ────────────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export type SortOrder = 'asc' | 'desc';

// ─── File upload ──────────────────────────────────────────────────────────────

export interface FileUploadResponse {
  id: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}

// ─── Toast / UI ───────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  variant?: ToastVariant;
  title?: string;
  description?: string;
  duration?: number;
  onDismiss?: () => void;
}

export interface ThemeMode {
  value: 'light' | 'dark' | 'system';
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  id: string;
  label: string;
  group: 'students' | 'courses' | 'teachers';
  href: string;
  meta?: string;
}

// ─── EmptyState (re-exported shape) ──────────────────────────────────────────

export interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}
