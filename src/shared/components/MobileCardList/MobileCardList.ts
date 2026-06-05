/**
 * @module MobileCardList
 * Barrel export for the MobileCardList component.
 *
 * Import from this barrel in all module-level code:
 *   import { MobileCardList } from '@shared/components/MobileCardList/MobileCardList';
 *   import type { BulkAction, EmptyStateProps } from '@shared/components/MobileCardList/MobileCardList';
 *
 * The real implementation lives in:
 *   src/shared/components/mobile/MobileCardList.tsx
 *
 * MobileCardList replaces DataTable on mobile viewports (< 640 px). It renders
 * paginated data as stacked cards and supports:
 *   – Long-press to enter bulk-selection mode (triggers haptic vibration)
 *   – Animated bulk-actions toolbar (Framer Motion spring slide-up)
 *   – Intersection-observer infinite scroll with 200 px rootMargin lookahead
 *   – Pull-to-refresh via the sibling PullToRefresh component
 *   – Skeleton loading state that matches the card layout
 *   – Empty- and error-state variants with retry / CTA buttons
 *   – Full reduced-motion support (useReducedMotion)
 *
 * ⚠️  Render this component only inside a `sm:hidden` (or equivalent) wrapper.
 *     Use DataTable for tablet (≥ 640 px) and desktop (≥ 1024 px) viewports.
 *
 * Usage:
 *   <MobileCardList
 *     data={students}
 *     renderCard={(student, isSelected) => <StudentCard student={student} isSelected={isSelected} />}
 *     isLoading={isLoading}
 *     hasMore={hasNextPage}
 *     onLoadMore={fetchNextPage}
 *     onRefresh={refetch}
 *     bulkActions={[{ label: 'Delete', variant: 'danger', onClick: handleDelete }]}
 *   />
 */

export { MobileCardList } from '../mobile/MobileCardList';
export type { BulkAction, EmptyStateProps } from '../mobile/MobileCardList';