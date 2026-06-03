'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone, type Accept } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Upload, X, File, Image, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { cn } from '@shared/utils/cn';
import { uploadFile } from '@shared/api/files.api';
import type { FileUploadResponse } from '@shared/types';

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error?: string;
  response?: FileUploadResponse;
  previewUrl?: string;
}

interface FileUploadZoneProps {
  onUpload: (files: FileUploadResponse[]) => void;
  accept?: Accept;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  label?: string;
  showPreview?: boolean;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FileUploadZone({
  onUpload,
  accept,
  maxSize = 10 * 1024 * 1024,
  maxFiles = 1,
  disabled = false,
  label,
  showPreview = true,
}: FileUploadZoneProps) {
  const t = useTranslations('upload');
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const processFile = useCallback(
    async (uploadingFile: UploadingFile) => {
      try {
        const response = await uploadFile(uploadingFile.file, (progress: number) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uploadingFile.id ? { ...f, progress } : f
            )
          );
        });
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id
              ? { ...f, status: 'done', progress: 100, response }
              : f
          )
        );
        // Notify parent with all completed uploads
        setFiles((current) => {
          const done = current
            .filter((f) => f.status === 'done' && f.response)
            .map((f) => f.response!);
          if (done.length > 0) onUpload(done);
          return current;
        });
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadingFile.id
              ? { ...f, status: 'error', error: (err as Error).message }
              : f
          )
        );
      }
    },
    [onUpload]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setRejectionError(null);
      const newFiles: UploadingFile[] = acceptedFiles.map((file) => ({
        id: `${file.name}-${Date.now()}`,
        file,
        progress: 0,
        status: 'uploading' as const,
        ...(file.type.startsWith('image/') ? { previewUrl: URL.createObjectURL(file) } : {}),
      }));
      setFiles((prev) => [...prev, ...newFiles]);
      newFiles.forEach(processFile);
    },
    [processFile]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    ...(accept !== undefined ? { accept } : {}),
    maxSize,
    maxFiles,
    disabled,
    onDropRejected: (rejections) => {
      const reason = rejections[0]?.errors[0]?.code;
      if (reason === 'file-too-large') setRejectionError(t('fileTooLarge', { size: formatBytes(maxSize) }));
      else if (reason === 'file-invalid-type') setRejectionError(t('invalidType'));
      else if (reason === 'too-many-files') setRejectionError(t('tooManyFiles', { max: maxFiles }));
      else setRejectionError(t('uploadError'));
    },
  });

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const toRemove = prev.find((f) => f.id === id);
      if (toRemove?.previewUrl) URL.revokeObjectURL(toRemove.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const retryFile = (uploadingFile: UploadingFile) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === uploadingFile.id ? { ...f, status: 'uploading' as const, progress: 0, error: undefined as never } : f
      )
    );
    processFile({ ...uploadingFile, status: 'uploading', progress: 0 });
  };

  const dropzoneProps = getRootProps();

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <motion.div
        ref={(el) => {
          // forward the ref from getRootProps if present
          if (typeof dropzoneProps.ref === 'function') {
            (dropzoneProps.ref as (el: HTMLDivElement | null) => void)(el);
          }
        }}
        onClick={dropzoneProps.onClick}
        onKeyDown={dropzoneProps.onKeyDown}
        onFocus={dropzoneProps.onFocus}
        onBlur={dropzoneProps.onBlur}
        onDragEnter={dropzoneProps.onDragEnter as React.DragEventHandler<HTMLDivElement>}
        onDragOver={dropzoneProps.onDragOver as React.DragEventHandler<HTMLDivElement>}
        onDragLeave={dropzoneProps.onDragLeave as React.DragEventHandler<HTMLDivElement>}
        onDrop={dropzoneProps.onDrop as React.DragEventHandler<HTMLDivElement>}
        tabIndex={dropzoneProps.tabIndex}
        role={dropzoneProps.role}
        aria-label={typeof dropzoneProps['aria-label'] === 'string' ? dropzoneProps['aria-label'] : (label ?? undefined)}
        animate={{
          borderColor: isDragActive
            ? 'var(--color-accent)'
            : isDragReject
              ? 'var(--color-error)'
              : 'var(--color-border)',
          backgroundColor: isDragActive ? 'var(--color-accent-subtle)' : 'transparent',
        }}
        transition={{ duration: 0.15 }}
        className={cn(
          'relative border-2 border-dashed rounded-xl transition-colors cursor-pointer',
          'hidden sm:flex flex-col items-center justify-center gap-3 py-10 px-6 text-center',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none'
        )}
      >
        <input
          {...getInputProps()}
          aria-label={label ?? t('dropzone')}
        />

        <motion.div
          animate={{ scale: isDragActive ? 1.1 : 1 }}
          transition={{ duration: 0.15 }}
          className="w-12 h-12 rounded-xl bg-[var(--color-accent-subtle)] flex items-center justify-center"
        >
          <Upload size={22} className="text-[var(--color-accent)]" aria-hidden="true" />
        </motion.div>

        <div>
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            {isDragActive ? t('dropNow') : t('dragOrClick')}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            {t('maxSize', { size: formatBytes(maxSize) })}
            {maxFiles > 1 && ` · ${t('maxFiles', { count: maxFiles })}`}
          </p>
        </div>
      </motion.div>

      {/* Mobile: tap to browse + camera */}
      <div className="sm:hidden">
        <input
          {...getInputProps()}
          aria-label={label ?? t('chooseFile')}
          // Camera capture for mobile images
          capture={accept && Object.keys(accept).some((k) => k.startsWith('image/'))
            ? 'environment'
            : undefined}
        />
        <button
          onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-[var(--color-border)] text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)] transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
        >
          <Upload size={16} aria-hidden="true" />
          {label ?? t('chooseFile')}
        </button>
      </div>

      {/* Rejection error */}
      <AnimatePresence>
        {rejectionError && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="flex items-center gap-1.5 text-xs text-[var(--color-error)]"
          >
            <AlertCircle size={12} aria-hidden="true" />
            {rejectionError}
          </motion.p>
        )}
      </AnimatePresence>

      {/* File list */}
      <AnimatePresence>
        {files.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--bg-card)]"
          >
            {/* Thumbnail / icon */}
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--color-accent-subtle)] flex items-center justify-center shrink-0">
              {showPreview && f.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.previewUrl} alt={f.file.name} className="w-full h-full object-cover" />
              ) : f.file.type.startsWith('image/') ? (
                <Image size={16} className="text-[var(--color-accent)]" aria-hidden="true" />
              ) : (
                <File size={16} className="text-[var(--color-accent)]" aria-hidden="true" />
              )}
            </div>

            {/* Info + progress */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                {f.file.name}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">{formatBytes(f.file.size)}</p>
              {f.status === 'uploading' && (
                <div className="mt-1.5 h-1 w-full rounded-full bg-[var(--color-skeleton)] overflow-hidden">
                  <motion.div
                    className="h-full bg-[var(--color-accent)] rounded-full"
                    animate={{ width: `${f.progress}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              )}
              {f.status === 'error' && (
                <p className="text-xs text-[var(--color-error)] mt-0.5">{f.error}</p>
              )}
            </div>

            {/* Status / actions */}
            <div className="flex items-center gap-1 shrink-0">
              {f.status === 'done' && (
                <CheckCircle2 size={16} className="text-[var(--color-success)]" aria-label="Uploaded" />
              )}
              {f.status === 'error' && (
                <button
                  onClick={() => retryFile(f)}
                  aria-label={t('retry')}
                  className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
                >
                  <RefreshCw size={14} aria-hidden="true" />
                </button>
              )}
              <button
                onClick={() => removeFile(f.id)}
                aria-label={t('remove')}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
