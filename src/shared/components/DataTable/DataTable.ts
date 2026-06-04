/**
 * @module DataTable
 * Barrel export for the DataTable component.
 *
 * Import from this barrel in all module-level code:
 *   import { DataTable } from '@shared/components/DataTable/DataTable';
 *   import type { ColumnDef, BulkAction } from '@shared/components/DataTable/DataTable';
 *
 * The real implementation lives in:
 *   src/shared/components/data-display/DataTable.tsx
 *
 * This indirection lets consuming modules stay decoupled from the file-system
 * location of the implementation, and allows the implementation to be swapped
 * without touching every import site.
 */

export { DataTable } from '../data-display/DataTable';
export type { ColumnDef, BulkAction } from '../data-display/DataTable';