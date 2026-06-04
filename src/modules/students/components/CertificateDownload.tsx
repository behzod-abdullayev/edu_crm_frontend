'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Download, Award, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { axiosInstance } from '@/services/api/axios.instance';
import { useToast } from '@shared/hooks/useToast';
import { cn } from '@shared/utils/cn';
import type { SignedUrl } from '@generated/models/signedUrl';

// ─── CertificateDto ───────────────────────────────────────────────────────────
// Exported so StudentCertificatesClient can import it.
// Mirrors the shape returned by GET /students/:id/certificates.

export interface CertificateDto {
  id: string;
  studentId: string;
  courseId: string;
  courseName?: string | undefined;
  fileUrl?: string | null | undefined;
  fileKey?: string | null | undefined;
  issuedAt: string;
  expiresAt?: string | null | undefined;
  createdAt: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CertificateDownloadProps {
  certificate: CertificateDto;
  className?: string | undefined;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CertificateDownload({
  certificate,
  className,
}: CertificateDownloadProps) {
  const t = useTranslations('student.certificates');
  const { toast } = useToast();
  const reduced = useReducedMotion() ?? false;

  const [isDownloading, setIsDownloading] = useState(false);
  const [justDownloaded, setJustDownloaded] = useState(false);

  const fileKey = certificate.fileKey ?? null;
  const canDownload = !!fileKey;

  const courseName = certificate.courseName ?? 'Course';
  const issuedAt = certificate.issuedAt
    ? format(new Date(certificate.issuedAt), 'MMMM d, yyyy')
    : null;

  function safeFilename(name: string): string {
    return name.trim().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9\-_]/g, '');
  }

  async function handleDownload() {
    if (!fileKey || isDownloading) return;

    setIsDownloading(true);
    try {
      const res = await axiosInstance<SignedUrl>({
        url: `/files/${fileKey}/signed-url`,
        method: 'GET',
      });

      const link = document.createElement('a');
      link.href = res.url;
      link.download = `certificate-${safeFilename(courseName)}.pdf`;
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setJustDownloaded(true);
      toast.success(`${t('download')} ✓`);

      const timer = window.setTimeout(() => setJustDownloaded(false), 3000);
      return () => window.clearTimeout(timer);
    } catch {
      toast.error('Failed to download certificate. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }

  const cardVariants = {
    initial: reduced ? {} : { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    whileHover: reduced ? {} : { y: -2 },
  };

  return (
    <motion.article
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="whileHover"
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-[var(--radius-xl)]',
        'border border-[var(--border-default)] bg-[var(--bg-surface)]',
        'shadow-[var(--shadow-sm)] transition-shadow duration-[var(--transition-base)]',
        'hover:shadow-[var(--shadow-lg)]',
        className,
      )}
      aria-label={`Certificate for ${courseName}`}
    >
      {/* ── Decorative header ────────────────────────────────────────────── */}
      <div
        className="relative flex h-36 flex-col items-center justify-center gap-2 overflow-hidden"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fef9c3 100%)',
          borderBottom: '1px solid #fcd34d',
        }}
      >
        {/* Watermark rings */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10">
          <div className="h-40 w-40 rounded-full border-4 border-amber-600" />
          <div className="absolute h-32 w-32 rounded-full border-2 border-amber-600" />
        </div>

        <motion.div
          className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100/80 shadow-md"
          whileHover={reduced ? {} : { rotate: [0, -6, 6, 0] }}
          transition={{ duration: 0.4 }}
        >
          <Award size={32} className="text-amber-600" strokeWidth={1.5} />
        </motion.div>

        <p className="relative z-10 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-700">
          Certificate of Completion
        </p>

        <div className="absolute inset-x-6 bottom-3 h-px bg-amber-300/60" />
        <div className="absolute inset-x-10 bottom-5 h-px bg-amber-300/30" />
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="space-y-1">
          <h3
            className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--text-primary)]"
            title={courseName}
          >
            {courseName}
          </h3>
          {issuedAt && (
            <p className="text-xs text-[var(--text-muted)]">
              <span className="sr-only">{t('issued')}:</span>
              {t('issued')} {issuedAt}
            </p>
          )}
        </div>

        <p
          className="truncate font-mono text-[10px] text-[var(--text-muted)]"
          title={`ID: ${certificate.id}`}
          aria-label={`Certificate ID: ${certificate.id}`}
        >
          ID: {certificate.id}
        </p>

        {/* Download button */}
        <motion.button
          type="button"
          onClick={handleDownload}
          disabled={!canDownload || isDownloading}
          aria-busy={isDownloading}
          aria-label={
            isDownloading
              ? 'Downloading certificate…'
              : canDownload
                ? `Download certificate for ${courseName}`
                : 'Certificate file not available'
          }
          whileTap={reduced ? {} : { scale: 0.97 }}
          className={cn(
            'mt-auto flex w-full items-center justify-center gap-2 rounded-lg',
            'h-11 min-h-[44px] px-4 text-sm font-semibold',
            'transition-colors duration-[var(--transition-fast)]',
            'focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50',
            justDownloaded
              ? 'bg-[var(--success-solid)] text-white'
              : canDownload
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-[var(--bg-surface-hover)] text-[var(--text-muted)]',
          )}
        >
          {isDownloading ? (
            <>
              <Loader2 size={16} aria-hidden="true" className="animate-spin" />
              <span>Downloading…</span>
            </>
          ) : justDownloaded ? (
            <>
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>Downloaded!</span>
            </>
          ) : (
            <>
              <Download size={16} aria-hidden="true" />
              <span>
                {canDownload ? `${t('download')} PDF` : 'Not available'}
              </span>
            </>
          )}
        </motion.button>
      </div>
    </motion.article>
  );
}
