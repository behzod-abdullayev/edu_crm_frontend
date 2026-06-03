/**
 * Re-export form error helpers for backwards-compatible imports.
 * Components can import from '@shared/lib/formErrors' or '@/shared/lib/formErrors'.
 *
 * Provides:
 *   - mapApiErrorsToForm — maps backend field errors to RHF setError() calls
 *   - parseApiError     — normalises any thrown value into an ApiError shape
 *   - ApiError          — the canonical error interface matching backend contract
 */
export {
  mapApiErrorsToForm,
  parseApiError,
} from '@shared/utils/api-error';

export type { ApiError } from '@shared/utils/api-error';
