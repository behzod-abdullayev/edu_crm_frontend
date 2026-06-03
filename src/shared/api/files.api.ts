/**
 * @file src/shared/api/files.api.ts
 *
 * Shared-layer re-export for the files API.
 * Consumers inside src/shared/** and src/modules/** import from here —
 * they NEVER import directly from src/services/api/files.api.ts.
 *
 * This barrel keeps the canonical implementation in one place
 * (src/services/api/files.api.ts) while exposing a stable surface
 * that is safe to import anywhere in the project.
 */

// ── Re-export the full api object ────────────────────────────────────────────
export { filesApi } from '@/services/api/files.api';

// ── Re-export response types so callers never reach into services directly ───
export type {
  FileUploadResponse,
  SignedUrlResponse,
} from '@/services/api/files.api';

// ── Convenience helpers ───────────────────────────────────────────────────────
import { filesApi } from '@/services/api/files.api';
import type { FileUploadResponse, SignedUrlResponse } from '@/services/api/files.api';

/**
 * Upload a single File object with optional progress reporting.
 *
 * Used by FileUploadZone and any module that needs a one-liner upload call.
 *
 * @param file       - The browser File object to upload.
 * @param onProgress - Optional callback receiving 0-100 percentage values.
 * @returns          The server response containing `key`, `url`, and metadata.
 *
 * @example
 * const response = await uploadFile(file, (pct) => setProgress(pct));
 * form.setValue('avatarKey', response.key);
 */
export const uploadFile = (
  file: File,
  onProgress?: (progress: number) => void,
): Promise<FileUploadResponse> => filesApi.upload(file, onProgress);

/**
 * Fetch a short-lived signed URL for a private file stored under `key`.
 *
 * Signed URLs expire after ~15 minutes; do NOT cache the result in
 * React Query for longer than 10 minutes (set staleTime ≤ 10 * 60 * 1000).
 *
 * @param key - The file storage key returned by `uploadFile`.
 * @returns    An object with `url` (pre-signed GET URL) and `expiresAt` (ISO string).
 *
 * @example
 * const { url } = await getSignedUrl(fileKey);
 * // url is safe to pass to <img src={url} /> or <video src={url} />
 */
export const getSignedUrl = (key: string): Promise<SignedUrlResponse> =>
  filesApi.getSignedUrl(key);

/**
 * Delete a file from storage.
 * Call this when a user removes a previously uploaded attachment.
 *
 * @param key - The storage key to delete.
 */
export const deleteFile = (key: string): Promise<void> =>
  filesApi.deleteFile(key);