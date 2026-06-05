'use client';

/**
 * FileUploadZone — full-featured file upload component.
 * Desktop: drag & drop + click to browse.
 * Mobile: tap-to-browse full-width button + camera capture option.
 *
 * Features:
 * - react-dropzone for drag/drop + click
 * - Per-file upload progress via axios onUploadProgress
 * - Retry on failure
 * - Signed URL preview for images/PDFs/video
 * - Type + size validation
 * - Mobile camera capture (accept="image/*" capture="environment")
 * - Full accessibility (ARIA labels, keyboard nav, live regions)
 * - Framer Motion animations throughout
 */

import {
  useCallback,
  useId,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';
import { useDropzone, type FileRejection, type Accept } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import axios, { type AxiosProgressEvent } from 'axios';
import {
  UploadCloud,
  X,
  FileText,
  ImageIcon,
  Film,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Camera,
  Eye,
} from 'lucide-react';
import { cn } from '@shared/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadedFile {
  /** Backend file key (S3/storage key) */
  key: string;
  /** Public or signed URL */
  url: string;
  /** Original filename */
  filename: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
}

type FileStatus = 'idle' | 'uploading' | 'success' | 'error';

interface ManagedFile {
  /** Stable local ID */
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  uploaded?: UploadedFile;
  error?: string;
  /** Object URL for local preview (revoked on remove) */
  previewUrl?: string;
}

type Action =
  | { type: 'ADD_FILES'; files: ManagedFile[] }
  | { type: 'SET_UPLOADING'; id: string }
  | { type: 'SET_PROGRESS'; id: string; progress: number }
  | { type: 'SET_SUCCESS'; id: string; uploaded: UploadedFile }
  | { type: 'SET_ERROR'; id: string; error: string }
  | { type: 'REMOVE'; id: string }
  | { type: 'RESET_FILE'; id: string };

interface State {
  files: ManagedFile[];
}

export interface FileUploadZoneProps {
  /** Callback when a file is successfully uploaded */
  onUpload?: (file: UploadedFile) => void;
  /** Callback when a file is removed */
  onRemove?: (key: string) => void;
  /** Max file size in bytes (default: 10 MB) */
  maxSize?: number;
  /** Max number of files (default: 1) */
  maxFiles?: number;
  /** Accepted MIME types (react-dropzone Accept format) */
  accept?: Accept;
  /** Upload endpoint (default: /api/v1/files/upload) */
  uploadUrl?: string;
  /** Whether to show the mobile camera capture button */
  enableCamera?: boolean;
  /** Already-uploaded files to display as pre-filled state */
  initialFiles?: UploadedFile[];
  className?: string;
  disabled?: boolean;
  /** Custom aria label for the dropzone */
  ariaLabel?: string;
  children?: ReactNode;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const DEFAULT_UPLOAD_URL = '/api/v1/files/upload';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(
  mimeType: string
): React.ElementType {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType.startsWith('video/')) return Film;
  return FileText;
}

function isPreviewable(mimeType: string): boolean {
  return (
    mimeType.startsWith('image/') ||
    mimeType === 'application/pdf' ||
    mimeType.startsWith('video/')
  );
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_FILES':
      return { files: [...state.files, ...action.files] };

    case 'SET_UPLOADING':
      return {
        files: state.files.map((f) =>
          f.id === action.id ? { ...f, status: 'uploading', progress: 0 } : f
        ),
      };

    case 'SET_PROGRESS':
      return {
        files: state.files.map((f) =>
          f.id === action.id ? { ...f, progress: action.progress } : f
        ),
      };

    case 'SET_SUCCESS':
      return {
        files: state.files.map((f) =>
          f.id === action.id
            ? { ...f, status: 'success', progress: 100, uploaded: action.uploaded }
            : f
        ),
      };

    case 'SET_ERROR':
      return {
        files: state.files.map((f) =>
          f.id === action.id
            ? { ...f, status: 'error', progress: 0, error: action.error }
            : f
        ),
      };

    case 'REMOVE': {
      const target = state.files.find((f) => f.id === action.id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return { files: state.files.filter((f) => f.id !== action.id) };
    }

    case 'RESET_FILE':
      return {
        files: state.files.map((f) =>
          f.id === action.id
            ? { ...f, status: 'idle', progress: 0, error: undefined }
            : f
        ),
      };

    default:
      return state;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-1.5 w-full bg-[var(--bg-surface-hover)] rounded-full overflow-hidden"
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="h-full bg-[var(--brand-primary)] rounded-full"
      />
    </div>
  );
}

function FilePreviewThumbnail({
  file,
  previewUrl,
}: {
  file: File;
  previewUrl?: string;
}) {
  const Icon = getFileIcon(file.type);

  if (previewUrl && file.type.startsWith('image/')) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={previewUrl}
        alt={file.name}
        className="w-10 h-10 rounded-lg object-cover shrink-0"
        loading="lazy"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface-hover)] flex items-center justify-center shrink-0">
      <Icon size={18} className="text-[var(--text-muted)]" aria-hidden="true" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FileUploadZone({
  onUpload,
  onRemove,
  maxSize = DEFAULT_MAX_SIZE,
  maxFiles = 1,
  accept,
  uploadUrl = DEFAULT_UPLOAD_URL,
  enableCamera = true,
  initialFiles = [],
  className,
  disabled = false,
  ariaLabel,
  children,
}: FileUploadZoneProps) {
  const t = useTranslations('upload');
  const dropzoneId = useId();
  const liveRegionId = useId();
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Convert initialFiles to ManagedFiles
  const initialManaged: ManagedFile[] = initialFiles.map((f) => ({
    id: generateId(),
    file: new File([], f.filename, { type: f.mimeType }),
    status: 'success',
    progress: 100,
    uploaded: f,
  }));

  const [state, dispatch] = useReducer(reducer, { files: initialManaged });
  const [rejectionError, setRejectionError] = useStateString('');

  // ── Upload logic ──────────────────────────────────────────────────────────
  const uploadFile = useCallback(
    async (managed: ManagedFile) => {
      dispatch({ type: 'SET_UPLOADING', id: managed.id });
      setRejectionError('');

      const formData = new FormData();
      formData.append('file', managed.file);

      try {
        const res = await axios.post<UploadedFile>(uploadUrl, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (event: AxiosProgressEvent) => {
            const total = event.total ?? 1;
            const pct = Math.round((event.loaded / total) * 100);
            dispatch({ type: 'SET_PROGRESS', id: managed.id, progress: pct });
          },
        });

        dispatch({ type: 'SET_SUCCESS', id: managed.id, uploaded: res.data });
        onUpload?.(res.data);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : t('uploadError');
        dispatch({ type: 'SET_ERROR', id: managed.id, error: message });
      }
    },
    [uploadUrl, onUpload, t]
  );

  // ── Dropzone ──────────────────────────────────────────────────────────────
  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      setRejectionError('');

      if (rejections.length > 0) {
        const first = rejections[0];
        const reason = first?.errors[0]?.code ?? '';
        if (reason === 'file-too-large') {
          setRejectionError(t('fileTooLarge', { size: formatBytes(maxSize) }));
        } else if (reason === 'too-many-files') {
          setRejectionError(t('tooManyFiles', { max: maxFiles }));
        } else if (reason === 'file-invalid-type') {
          setRejectionError(t('invalidType'));
        } else {
          setRejectionError(t('uploadError'));
        }
        return;
      }

      const newFiles: ManagedFile[] = accepted.map((file) => ({
        id: generateId(),
        file,
        status: 'idle',
        progress: 0,
        previewUrl: isPreviewable(file.type)
          ? URL.createObjectURL(file)
          : undefined,
      }));

      dispatch({ type: 'ADD_FILES', files: newFiles });

      // Auto-start upload for each new file
      newFiles.forEach((mf) => void uploadFile(mf));
    },
    [maxSize, maxFiles, t, uploadFile]
  );

  const canAddMore =
    !disabled && state.files.length < maxFiles;

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      onDrop,
      accept,
      maxSize,
      maxFiles: maxFiles - state.files.length,
      disabled: !canAddMore,
      noClick: false,
      noKeyboard: false,
    });

  // ── Camera capture ────────────────────────────────────────────────────────
  const handleCameraCapture = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const mf: ManagedFile = {
        id: generateId(),
        file,
        status: 'idle',
        progress: 0,
        previewUrl: URL.createObjectURL(file),
      };
      dispatch({ type: 'ADD_FILES', files: [mf] });
      void uploadFile(mf);
      // Reset input so same file can be captured again
      e.target.value = '';
    },
    [uploadFile]
  );

  // ── Remove handler ────────────────────────────────────────────────────────
  const handleRemove = useCallback(
    (managed: ManagedFile) => {
      if (managed.uploaded?.key) {
        onRemove?.(managed.uploaded.key);
      }
      dispatch({ type: 'REMOVE', id: managed.id });
    },
    [onRemove]
  );

  // ── Retry handler ─────────────────────────────────────────────────────────
  const handleRetry = useCallback(
    (managed: ManagedFile) => {
      dispatch({ type: 'RESET_FILE', id: managed.id });
      void uploadFile({ ...managed, status: 'idle', progress: 0 });
    },
    [uploadFile]
  );

  // ── Open preview ──────────────────────────────────────────────────────────
  const handlePreview = useCallback((managed: ManagedFile) => {
    const url = managed.uploaded?.url ?? managed.previewUrl;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // ── Dropzone style state ──────────────────────────────────────────────────
  const dropzoneBorderClass = isDragReject
    ? 'border-[var(--error-solid)] bg-[var(--error-bg)]'
    : isDragActive
      ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
      : canAddMore
        ? 'border-[var(--border-default)] hover:border-[var(--border-focus)] hover:bg-[var(--bg-surface-hover)]'
        : 'border-[var(--border-default)] opacity-50 cursor-not-allowed';

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* ── Dropzone area ── */}
      {canAddMore && (
        <div
          {...getRootProps()}
          id={dropzoneId}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={
            ariaLabel ??
            t('dropzone')
          }
          aria-describedby={liveRegionId}
          aria-disabled={disabled}
          className={cn(
            'relative flex flex-col items-center justify-center gap-2',
            'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer',
            'transition-colors duration-[var(--transition-base)] outline-none',
            'focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-2',
            // Mobile: larger tap area, full-width button feel
            'min-h-[120px] sm:min-h-[160px]',
            dropzoneBorderClass
          )}
        >
          {/* Hidden file input (react-dropzone) */}
          <input {...getInputProps()} aria-hidden="true" />

          {/* Animated drag overlay */}
          <AnimatePresence>
            {isDragActive && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-xl flex items-center justify-center bg-[var(--brand-primary)]/5 backdrop-blur-sm pointer-events-none"
                aria-hidden="true"
              >
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                >
                  <UploadCloud
                    size={40}
                    className="text-[var(--brand-primary)]"
                    aria-hidden="true"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Default content */}
          {!isDragActive && (
            <>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.15 }}
                className="w-12 h-12 rounded-xl bg-[var(--brand-primary)]/10 flex items-center justify-center"
                aria-hidden="true"
              >
                <UploadCloud
                  size={22}
                  className="text-[var(--brand-primary)]"
                  aria-hidden="true"
                />
              </motion.div>

              {/* Desktop drag/click text — hidden on mobile */}
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {t('dragOrClick')}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t('maxSize', { size: formatBytes(maxSize) })}
                  {maxFiles > 1 && ` · ${t('maxFiles', { count: maxFiles })}`}
                </p>
              </div>

              {/* Mobile: just a button label */}
              <div className="sm:hidden">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {t('chooseFile')}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {t('maxSize', { size: formatBytes(maxSize) })}
                </p>
              </div>

              {children}
            </>
          )}

          {/* Drag-active text */}
          {isDragActive && !isDragReject && (
            <p className="text-sm font-semibold text-[var(--brand-primary)] relative z-10">
              {t('dragActive')}
            </p>
          )}

          {/* Drag-reject text */}
          {isDragReject && (
            <p className="text-sm font-semibold text-[var(--error-solid)]">
              {t('invalidType')}
            </p>
          )}
        </div>
      )}

      {/* ── Mobile camera capture button ── */}
      {enableCamera && canAddMore && (
        <div className="sm:hidden">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraCapture}
            aria-hidden="true"
            className="sr-only"
            tabIndex={-1}
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => cameraInputRef.current?.click()}
            className={cn(
              'w-full flex items-center justify-center gap-2',
              'h-11 rounded-xl border border-[var(--border-default)]',
              'bg-[var(--bg-surface)] text-sm font-medium text-[var(--text-secondary)]',
              'hover:bg-[var(--bg-surface-hover)] transition-colors duration-[var(--transition-fast)]',
              'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]'
            )}
            aria-label={t('camera')}
          >
            <Camera size={16} aria-hidden="true" />
            {t('camera')}
          </motion.button>
        </div>
      )}

      {/* ── Validation error ── */}
      <AnimatePresence>
        {rejectionError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            role="alert"
            className="flex items-center gap-2 text-xs text-[var(--error-text)] bg-[var(--error-bg)] border border-[var(--error-border)] rounded-lg px-3 py-2"
          >
            <AlertCircle size={13} aria-hidden="true" className="shrink-0" />
            {rejectionError}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── File list ── */}
      <AnimatePresence initial={false}>
        {state.files.map((managed) => {
          const Icon = getFileIcon(managed.file.type);
          const isUploading = managed.status === 'uploading';
          const isSuccess = managed.status === 'success';
          const isError = managed.status === 'error';
          const canPreview =
            isSuccess && isPreviewable(managed.file.type);

          return (
            <motion.div
              key={managed.id}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl border',
                'transition-colors duration-[var(--transition-fast)]',
                isError
                  ? 'border-[var(--error-border)] bg-[var(--error-bg)]'
                  : isSuccess
                    ? 'border-[var(--success-border)] bg-[var(--success-bg)]'
                    : 'border-[var(--border-default)] bg-[var(--bg-surface)]'
              )}
            >
              {/* Thumbnail / icon */}
              <FilePreviewThumbnail
                file={managed.file}
                previewUrl={managed.previewUrl}
              />

              {/* File info + progress */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium text-[var(--text-primary)] truncate"
                  title={managed.file.name}
                >
                  {managed.file.name}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {formatBytes(managed.file.size)}
                </p>

                {/* Progress bar */}
                {isUploading && (
                  <div className="mt-2 space-y-1">
                    <ProgressBar progress={managed.progress} />
                    <p className="text-xs text-[var(--text-muted)]">
                      {t('progress', { progress: managed.progress })}
                    </p>
                  </div>
                )}

                {/* Error message */}
                {isError && managed.error && (
                  <p
                    role="alert"
                    className="text-xs text-[var(--error-text)] mt-1"
                  >
                    {managed.error}
                  </p>
                )}
              </div>

              {/* Status icon + actions */}
              <div className="flex items-center gap-1 shrink-0">
                {/* Success indicator */}
                {isSuccess && (
                  <CheckCircle2
                    size={16}
                    className="text-[var(--success-solid)]"
                    aria-label="Uploaded"
                    aria-hidden="true"
                  />
                )}

                {/* Error indicator */}
                {isError && (
                  <AlertCircle
                    size={16}
                    className="text-[var(--error-solid)]"
                    aria-label="Upload failed"
                    aria-hidden="true"
                  />
                )}

                {/* Preview button */}
                {canPreview && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handlePreview(managed)}
                    aria-label={t('preview')}
                    className={cn(
                      'p-1.5 rounded-lg text-[var(--text-muted)]',
                      'hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]',
                      'transition-colors duration-[var(--transition-fast)]',
                      'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]'
                    )}
                  >
                    <Eye size={14} aria-hidden="true" />
                  </motion.button>
                )}

                {/* Retry button */}
                {isError && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRetry(managed)}
                    aria-label={t('retry')}
                    className={cn(
                      'p-1.5 rounded-lg text-[var(--error-text)]',
                      'hover:bg-[var(--error-bg)]',
                      'transition-colors duration-[var(--transition-fast)]',
                      'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]'
                    )}
                  >
                    <RefreshCw size={14} aria-hidden="true" />
                  </motion.button>
                )}

                {/* Remove button */}
                {!isUploading && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRemove(managed)}
                    aria-label={t('remove')}
                    className={cn(
                      'p-1.5 rounded-lg text-[var(--text-muted)]',
                      'hover:text-[var(--error-solid)] hover:bg-[var(--error-bg)]',
                      'transition-colors duration-[var(--transition-fast)]',
                      'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]'
                    )}
                  >
                    <X size={14} aria-hidden="true" />
                  </motion.button>
                )}

                {/* Cancel upload (while uploading, only remove after done) */}
                {isUploading && (
                  <span
                    className="p-1.5 opacity-40 cursor-not-allowed"
                    aria-hidden="true"
                  >
                    <X size={14} />
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* ── Screen reader live region ── */}
      <div
        id={liveRegionId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {state.files.map((f) => {
          if (f.status === 'uploading') {
            return `${f.file.name}: ${t('progress', { progress: f.progress })}`;
          }
          if (f.status === 'success') {
            return `${f.file.name}: ${t('uploaded')}`;
          }
          if (f.status === 'error') {
            return `${f.file.name}: ${f.error ?? t('uploadError')}`;
          }
          return null;
        })}
      </div>
    </div>
  );
}

// ─── Tiny useState wrapper for string (avoids re-import) ──────────────────────

function useStateString(
  initial: string
): [string, (v: string) => void] {
  const [val, setVal] = useReducer(
    (_: string, next: string) => next,
    initial
  );
  return [val, setVal];
}