'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@shared/utils/cn';

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Map URL segments to nav translation keys
const SEGMENT_KEY_MAP: Record<string, string> = {
  groups: 'myGroups',
};

export function Breadcrumb() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('nav');

  // Remove locale prefix from segments (e.g. '/en/teacher/groups' → ['teacher','groups'])
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .filter((seg) => seg !== locale);

  const crumbs = segments.map((seg, i) => {
    // Map segment to correct translation key (e.g. 'groups' → 'myGroups')
    const tKey = SEGMENT_KEY_MAP[seg] ?? seg;
    // Dynamic segments (course/student/etc. UUIDs) have no translation —
    // t.has() avoids next-intl's MISSING_MESSAGE console error.
    const label = t.has(tKey as Parameters<typeof t.has>[0])
      ? t(tKey as Parameters<typeof t>[0])
      : capitalize(seg);

    // Build href including locale prefix
    return {
      label,
      href: `/${locale}/` + segments.slice(0, i + 1).join('/'),
      isLast: i === segments.length - 1,
    };
  });

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1 text-sm min-w-0" role="list">
        <li className="shrink-0">
          <Link
            href={`/${locale}`}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded"
            aria-label="Home"
          >
            <Home size={14} aria-hidden="true" />
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-1 min-w-0">
            <ChevronRight
              size={12}
              className="text-[var(--text-muted)] shrink-0"
              aria-hidden="true"
            />
            {crumb.isLast ? (
              <span
                aria-current="page"
                className="font-medium text-[var(--text-primary)] truncate max-w-[120px] sm:max-w-[200px]"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className={cn(
                  'text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                  'transition-colors truncate max-w-[80px] sm:max-w-[160px]',
                  'outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] rounded',
                )}
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
