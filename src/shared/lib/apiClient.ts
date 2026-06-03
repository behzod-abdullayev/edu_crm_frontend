/**
 * Re-export axiosInstance as apiClient for backwards-compatible imports.
 * Components can import from '@shared/lib/apiClient' or '@/shared/lib/apiClient'.
 *
 * Provides:
 *   - apiClient   (named)  — the orval-compatible mutator function
 *   - httpClient  (named)  — the full Axios instance for raw HTTP calls
 *   - default              — same as apiClient (for `import apiClient from '...'`)
 */
export {
  axiosInstance as apiClient,
  httpClient,
} from '@/services/api/axios.instance';

export { default } from '@/services/api/axios.instance';
