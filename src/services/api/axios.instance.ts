import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { useTenantStore } from '@/store/tenant.store';
import { useUIStore } from '@/store/ui.store';
import type { ApiError } from '@/shared/utils/api-error';

interface QueueItem {
  resolve: (value: string | null) => void;
  reject: (reason: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueueItem[] = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach((item) => {
    if (error) item.reject(error);
    else item.resolve(token);
  });
  failedQueue = [];
}

function mapToApiError(error: AxiosError): ApiError {
  const data = error.response?.data as Record<string, unknown> | undefined;
  return {
    statusCode: error.response?.status ?? 0,
    message: typeof data?.message === 'string' ? data.message : error.message,
    code: typeof data?.code === 'string' ? data.code : 'UNKNOWN_ERROR',
    errors:
      data?.errors != null && typeof data.errors === 'object' && !Array.isArray(data.errors)
        ? (data.errors as Record<string, string[]>)
        : {},
    details: data?.details,
  };
}

// ── Internal axios instance (with all interceptors) ─────────────────────────
const _instance: AxiosInstance = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL}/api/v1`,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

_instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

_instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const tenantId = useTenantStore.getState().tenantId;
    if (tenantId) config.headers['X-Tenant-ID'] = tenantId;
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

_instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const locale =
      typeof window !== 'undefined' ? (localStorage.getItem('NEXT_LOCALE') ?? 'en') : 'en';
    config.headers['Accept-Language'] = locale;
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

_instance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const addToast = useUIStore.getState().addToast;
    const authStore = useAuthStore.getState();

    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token)
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return _instance(originalRequest);
          })
          .catch((err: unknown) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      const refreshToken = authStore.refreshToken;

      if (!refreshToken) {
        authStore.clearAuth();
        processQueue(error, null);
        isRefreshing = false;
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(mapToApiError(error));
      }

      try {
        const { data } = await axios.post<{
          accessToken: string;
          refreshToken: string;
          expiresIn: number;
        }>(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`, { refreshToken });
        authStore.setTokens(data);
        processQueue(null, data.accessToken);
        if (originalRequest.headers)
          originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        return _instance(originalRequest);
      } catch (refreshError: unknown) {
        processQueue(refreshError, null);
        authStore.clearAuth();
        if (typeof window !== 'undefined') window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (status === 403)
      addToast({ type: 'error', title: 'errors.accessDenied', description: 'errors.accessDeniedDescription' });

    if (status === 429)
      addToast({ type: 'warning', title: 'errors.rateLimited', description: 'errors.rateLimitedDescription', duration: 6000 });

    if (typeof status === 'number' && status >= 500)
      addToast({ type: 'error', title: 'errors.serverError', description: 'errors.serverErrorDescription' });

    return Promise.reject(mapToApiError(error));
  },
);

// ── Orval mutator — bu funksiya orval tomonidan chaqiriladi ─────────────────
// Orval (config: AxiosRequestConfig) => Promise<T> ko'rinishidagi funksiya kutadi
export const axiosInstance = <T>(config: AxiosRequestConfig): Promise<T> =>
  _instance(config).then((res) => res.data as T);

// ── Full Axios instance — API service fayllarida ishlatish uchun ─────────────
export const httpClient: AxiosInstance = _instance;

export default axiosInstance;