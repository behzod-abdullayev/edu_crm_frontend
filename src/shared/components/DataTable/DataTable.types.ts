/**
 * @module DataTable/types
 * Public type surface for the DataTable component.
 *
 * Import from this barrel whenever you only need the types (no runtime code):
 *   import type { ColumnDef, BulkAction } from '@shared/components/DataTable/DataTable.types';
 *
 * Keeping types in a dedicated barrel lets consumers opt-in to type-only
 * imports without pulling in React or framer-motion at the bundle level.
 */

export type { ColumnDef, BulkAction } from '../data-display/DataTable';