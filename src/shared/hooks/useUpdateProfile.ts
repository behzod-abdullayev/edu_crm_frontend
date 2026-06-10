'use client';

import { useMutation } from '@tanstack/react-query';
import { httpClient } from '@/services/api/axios.instance';
import { useCurrentUser } from './useCurrentUser';

// ─── Update profile (PATCH /users/me) ─────────────────────────────────────────

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  language?: 'uz' | 'ru' | 'en';
  avatarUrl?: string;
}

/**
 * Persists profile changes via `PATCH /users/me` and refreshes the cached
 * `useCurrentUser()` data on success so the UI reflects the new values
 * (full name, phone, avatar, language) without a full page reload.
 */
export function useUpdateProfile() {
  const { refetch } = useCurrentUser();

  const mutation = useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const { data } = await httpClient.patch('/users/me', payload);
      return data;
    },
    onSuccess: () => {
      refetch();
    },
  });

  return {
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}

// ─── Avatar upload (POST /files/upload) ───────────────────────────────────────

export interface UploadResult {
  url: string;
  key: string;
  filename: string;
}

/**
 * Uploads an image via `POST /files/upload`. The backend's
 * LocalStorageProvider returns a relative URL (`/uploads/...`) that is only
 * resolvable against the API origin — callers should resolve it against
 * `NEXT_PUBLIC_API_URL` before persisting/displaying it.
 */
export function useUploadAvatar() {
  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await httpClient.post<UploadResult>(
        '/files/upload?entity=avatar&public=true',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return data;
    },
  });

  return {
    uploadAvatar: mutation.mutateAsync,
    isUploading: mutation.isPending,
  };
}

/** Resolves a possibly-relative file URL against the API origin. */
export function resolveFileUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? '';
  return `${apiUrl}${url}`;
}
