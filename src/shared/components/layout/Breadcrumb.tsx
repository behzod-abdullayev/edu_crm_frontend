'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@shared/utils/cn';

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function Breadcrumb() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    label: (() => { try { return t(seg); } catch { return capitalize(seg); } })(),
    href: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }));

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1 text-sm min-w-0" role="list">
        <li className="shrink-0">
          <Link
            href="/"
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] rounded"
            aria-label="Home"
          >
            <Home size={14} aria-hidden="true" />
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1 min-w-0">
            <ChevronRight size={12} className="text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
            {crumb.isLast ? (
              <span
                aria-current="page"
                className="font-medium text-[var(--color-text-primary)] truncate max-w-[120px] sm:max-w-[200px]"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors truncate max-w-[80px] sm:max-w-[160px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] rounded"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
