/**
 * Convenience barrel — re-exports the canonical queryKeys factory from the
 * services layer so modules can import from either location without caring
 * about the internal path:
 *
 *   import { queryKeys } from '@shared/constants/query-keys';
 *   // or
 *   import { queryKeys } from '@services/query/keys.factory';
 *
 * Both resolve to the same object at runtime.
 */
export { queryKeys, type PaginationParams } from '@/services/query/keys.factory';
