import type { SortOrder, Nullable } from './common.types';

/** Query params for offset-based pagination */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  order?: SortOrder;
  search?: string;
}

/** Pagination metadata in API responses */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Offset-paginated list response */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/** Query params for cursor-based pagination */
export interface CursorParams {
  cursor?: string;
  limit: number;
}

/** Cursor-paginated list response */
export interface CursorResponse<T> {
  data: T[];
  nextCursor: Nullable<string>;
  hasMore: boolean;
}

/** Infinite query page */
export interface InfinitePageParam {
  cursor?: string;
  page?: number;
}
