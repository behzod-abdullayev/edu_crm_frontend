/**
 * Convenience re-export so that imports from either location resolve correctly:
 *
 *   import { MobileBottomNav } from '@shared/components/layout/MobileBottomNav';
 *   import { MobileBottomNav } from '@shared/components/mobile/MobileBottomNav';
 *
 * Both paths are valid. The canonical implementation lives in mobile/.
 */
export { MobileBottomNav } from '@/shared/components/mobile/MobileBottomNav';
