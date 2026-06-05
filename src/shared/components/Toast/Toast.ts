/**
 * @file src/shared/components/Toast/Toast.ts
 *
 * Barrel re-export for the Toast component.
 *
 * The actual implementation lives in ../feedback/Toast.tsx which exports:
 *   - Toast         — single toast message component
 *   - ToastContainer — container that renders all active toasts from UIStore
 *
 * This barrel exists so that tests and consumers can import from the
 * canonical path @/shared/components/Toast/Toast without reaching into
 * the feedback sub-directory directly.
 *
 * Usage:
 *   import { Toast } from '@/shared/components/Toast/Toast';
 */

export { Toast } from '../feedback/Toast';