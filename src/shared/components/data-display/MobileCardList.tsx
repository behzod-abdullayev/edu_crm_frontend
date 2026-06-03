/**
 * Convenience re-export so that imports from either location resolve correctly:
 *
 *   import { MobileCardList } from '@shared/components/data-display/MobileCardList';
 *   import { MobileCardList } from '@shared/components/mobile/MobileCardList';
 *
 * Both paths are valid. The canonical implementation lives in mobile/.
 */
export {
  MobileCardList,
  type BulkAction,
  type EmptyStateProps,
} from '@/shared/components/mobile/MobileCardList';
