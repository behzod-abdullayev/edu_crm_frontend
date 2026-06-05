/**
 * @module SkeletonLoader
 * Barrel export for the SkeletonLoader component.
 *
 * Import from this barrel in all module-level code:
 *   import { SkeletonLoader } from '@shared/components/SkeletonLoader/SkeletonLoader';
 *   import type { SkeletonLoaderProps } from '@shared/components/SkeletonLoader/SkeletonLoader';
 *
 * The real implementation lives in:
 *   src/shared/components/feedback/SkeletonLoader.tsx
 *
 * SkeletonLoader renders an animated shimmer placeholder that matches the
 * exact layout of the real content it replaces.  It uses a left-to-right
 * shimmer keyframe (defined in globals.css + tailwind.config.ts) and the
 * project CSS variables — no external dependencies beyond the design system.
 *
 * Available variants:
 *   'text'    – stacked text lines (paragraph placeholder)
 *   'card'    – surface card with header, body, and footer rows
 *   'table'   – full table with header + 5 data rows (desktop)
 *   'kpi'     – KPI card with icon, value, trend, and sparkline area
 *   'chart'   – chart panel with Y-axis labels and bar columns
 *   'avatar'  – avatar circle + two text lines (list-item placeholder)
 *
 * The `count` prop renders multiple instances stacked with gap-3 spacing.
 *
 * ⚠️  NEVER use a spinner for page-level or list content — use SkeletonLoader.
 *     Spinners are only acceptable for inline/button-level loading states.
 *
 * Usage:
 *   // Single card skeleton while data is loading:
 *   {isLoading && <SkeletonLoader variant="card" />}
 *
 *   // Four KPI card skeletons in a grid:
 *   {isLoading && <SkeletonLoader variant="kpi" count={4} className="grid grid-cols-2 lg:grid-cols-4 gap-4" />}
 *
 *   // Table skeleton replacing the DataTable:
 *   {isLoading && <SkeletonLoader variant="table" />}
 */

export { SkeletonLoader } from '../feedback/SkeletonLoader';
export type { SkeletonLoaderProps } from '../feedback/SkeletonLoader';