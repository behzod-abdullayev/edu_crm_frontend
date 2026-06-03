import { httpClient } from './axios.instance';
import type { AxiosProgressEvent } from 'axios';

export interface FileUploadResponse {
  id: string;
  key: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface SignedUrlResponse {
  url: string;
  expiresAt: string;
}

export const filesApi = {
  upload: async (
    file: File,
    onProgress?: (percentage: number) => void,
  ): Promise<FileUploadResponse> => {
    const form = new FormData();
    form.append('file', file);

    const { data } = await httpClient.post<FileUploadResponse>(
      '/files/upload',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentage = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            onProgress(percentage);
          }
        },
      },
    );
    return data;
  },

  getSignedUrl: async (key: string): Promise<SignedUrlResponse> => {
    const { data } = await httpClient.get<SignedUrlResponse>(
      `/files/${key}/signed-url`,
    );
    return data;
  },

  deleteFile: async (key: string): Promise<void> => {
    await httpClient.delete(`/files/${key}`);
  },
};
