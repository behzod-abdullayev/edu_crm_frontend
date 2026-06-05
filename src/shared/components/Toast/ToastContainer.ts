/**
 * @file src/shared/components/Toast/ToastContainer.ts
 *
 * Barrel re-export for the ToastContainer component.
 *
 * The actual implementation lives in ../feedback/Toast.tsx which exports both
 * the Toast component and the ToastContainer that renders all active toasts
 * from the UIStore (Zustand).
 *
 * This barrel exists so that tests and consumers can import from the
 * canonical path @/shared/components/Toast/ToastContainer without reaching
 * into the feedback sub-directory directly.
 *
 * Usage:
 *   import { ToastContainer } from '@/shared/components/Toast/ToastContainer';
 *
 *   // Mount once at the root layout — receives toasts from useUIStore:
 *   export default function RootLayout({ children }) {
 *     return (
 *       <html>
 *         <body>
 *           {children}
 *           <ToastContainer />
 *         </body>
 *       </html>
 *     );
 *   }
 */

export { ToastContainer } from '../feedback/Toast';