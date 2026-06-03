import type { StringRecord } from './common.types';

/** Standard API error shape */
export interface ApiError {
  statusCode: number;
  message: string;
  code: string;
  errors: Record<string, string[]>;
  details?: StringRecord;
  timestamp?: string;
  path?: string;
}

/** Generic success response wrapper */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

/** Explicit success response (data guaranteed) */
export type ApiSuccessResponse<T> = ApiResponse<T> & {
  success: true;
  data: T;
};

/** File upload response from the API */
export interface FileUploadResponse {
  url: string;
  key: string;
  filename: string;
  mimeType: string;
  size: number;
}

/** Batch operation result */
export interface BatchOperationResult {
  succeeded: string[];
  failed: Array<{ id: string; reason: string }>;
  total: number;
  successCount: number;
  failureCount: number;
}
