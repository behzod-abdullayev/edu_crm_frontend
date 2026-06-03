/**
 * @file src/shared/api/search.api.ts
 *
 * Global search API façade used by the shared layer.
 *
 * Components that need global search (GlobalSearch, MobileSearchOverlay)
 * import from here. The raw HTTP call is kept in this file because global
 * search is a cross-cutting concern that does not belong to a single module.
 *
 * Endpoint: GET /search?q=<query>&limit=<limit>&types=<types>
 */

import { httpClient } from '@/services/api/axios.instance';
import type { SearchResult } from '@shared/types';

// ── Request / Response types ──────────────────────────────────────────────────

/** Comma-separated entity types the caller is interested in. */
export type SearchEntityType = 'students' | 'courses' | 'teachers';

/** Query parameters accepted by GET /search */
export interface GlobalSearchParams {
  /** Raw search term — minimum 1 character. */
  q: string;
  /** Maximum number of results to return (default: 10, max: 50). */
  limit?: number;
  /**
   * Restrict results to specific entity types.
   * When omitted the backend searches across all entity types.
   */
  types?: SearchEntityType[];
}

/** Raw response body from GET /search */
export interface GlobalSearchResponse {
  results: SearchResult[];
  total: number;
  /** Time taken by the backend query, in milliseconds. */
  took?: number;
}

// ── API call ──────────────────────────────────────────────────────────────────

/**
 * Execute a global search query across all searchable entities.
 *
 * Accepts either a `GlobalSearchParams` object OR a plain query string
 * (backwards-compatible with GlobalSearch.tsx which calls `searchGlobal(string)`).
 *
 * An AbortSignal can be supplied when the call is issued inside a React
 * `useEffect` or a TanStack Query `queryFn` that supports cancellation.
 *
 * @param paramsOrQuery - GlobalSearchParams object OR a plain search string.
 * @param signal        - Optional AbortSignal for request cancellation.
 * @returns              Flat array of SearchResult items ordered by relevance.
 *
 * @example — string usage (GlobalSearch component)
 * searchGlobal(debouncedQuery)
 *   .then(setResults)
 *   .catch(() => {});
 *
 * @example — object usage (TanStack Query)
 * const { data } = useQuery({
 *   queryKey: ['search', query],
 *   queryFn: ({ signal }) => searchGlobal({ q: query }, signal),
 *   enabled: query.length > 0,
 * });
 */
export const searchGlobal = async (
  paramsOrQuery: GlobalSearchParams | string,
  signal?: AbortSignal,
): Promise<SearchResult[]> => {
  // Normalise: accept both string and object call signatures
  const params: GlobalSearchParams =
    typeof paramsOrQuery === 'string'
      ? { q: paramsOrQuery }
      : paramsOrQuery;

  // Build query params object — only include defined values to satisfy
  // exactOptionalPropertyTypes: true on AxiosRequestConfig.
  const queryParams: Record<string, string | number> = {
    q: params.q,
    limit: params.limit ?? 10,
  };

  if (params.types && params.types.length > 0) {
    queryParams['types'] = params.types.join(',');
  }

  // exactOptionalPropertyTypes: true requires we NOT pass `signal: undefined`
  // when no signal is provided — so we spread it conditionally.
  const { data } = await httpClient.get<GlobalSearchResponse>('/search', {
    params: queryParams,
    ...(signal !== undefined ? { signal } : {}),
  });

  // `data` here is the Axios response `.data` field, typed as GlobalSearchResponse.
  return data.results;
};

/**
 * Convenience alias — accepts a plain query string.
 * Kept for call-sites that prefer the explicit two-argument form.
 *
 * @param query  - Raw search term.
 * @param limit  - Max result count (default: 10).
 * @param signal - Optional AbortSignal.
 *
 * @example
 * const results = await searchByQuery('ali vali', 5);
 */
export const searchByQuery = (
  query: string,
  limit = 10,
  signal?: AbortSignal,
): Promise<SearchResult[]> =>
  searchGlobal({ q: query, limit }, signal);