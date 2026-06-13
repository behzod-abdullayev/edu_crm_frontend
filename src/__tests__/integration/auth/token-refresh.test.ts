import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { httpClient } from '@/services/api/axios.instance';
import { useAuthStore } from '@/store/auth.store';
import type { AuthTokens, UserProfile } from '@/services/api/auth.api';

// We test the axios interceptor logic directly by simulating 401 responses
// and verifying the refresh + retry flow.

let mockAxios: MockAdapter;

const mockTokens: AuthTokens = {
  accessToken: 'old-access-token',
  refreshToken: 'old-refresh-token',
  expiresIn: 3600,
};

const newTokens: AuthTokens = {
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
  expiresIn: 3600,
};

const mockUser: UserProfile = {
  id: 'user-1',
  email: 'test@test.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'student',
  status: 'active',
  permissions: [],
  tenantId: 'tenant-1',
  profilePictureUrl: null,
  phone: null,
  preferredLanguage: 'en',
  twoFactorEnabled: false,
  teacherId: null,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('Token Refresh Interceptor', () => {
  beforeEach(() => {
    // Attach mock adapter to the shared httpClient instance
    mockAxios = new MockAdapter(httpClient);
    act(() => {
      useAuthStore.getState().setTokens(mockTokens);
      useAuthStore.getState().setUser(mockUser);
    });
  });

  afterEach(() => {
    mockAxios.restore();
    act(() => {
      useAuthStore.getState().clearAuth();
    });
    vi.clearAllMocks();
  });

  // ─── 401 response handling ─────────────────────────────────────────────────

  describe('401 response handling', () => {
    it('calls refresh token endpoint when receiving 401', async () => {
      let refreshCalled = false;

      mockAxios.onGet('/students').replyOnce(401);
      mockAxios.onPost('/auth/refresh').reply(() => {
        refreshCalled = true;
        return [200, newTokens];
      });
      mockAxios.onGet('/students').reply(200, []);

      try {
        await httpClient.get('/students');
      } catch {
        // may throw or not depending on implementation
      }

      expect(refreshCalled).toBe(true);
    });

    it('retries original request with new access token after refresh', async () => {
      let retryAuthHeader: string | undefined;

      mockAxios.onGet('/students').replyOnce(401);
      mockAxios.onPost('/auth/refresh').reply(200, newTokens);
      mockAxios.onGet('/students').reply((config) => {
        retryAuthHeader = config.headers?.['Authorization'] as string | undefined;
        return [200, []];
      });

      await httpClient.get('/students');

      expect(retryAuthHeader).toContain('new-access-token');
    });

    it('updates stored tokens after successful refresh', async () => {
      mockAxios.onGet('/students').replyOnce(401);
      mockAxios.onPost('/auth/refresh').reply(200, newTokens);
      mockAxios.onGet('/students').reply(200, []);

      await httpClient.get('/students');

      expect(useAuthStore.getState().accessToken).toBe('new-access-token');
      expect(useAuthStore.getState().refreshToken).toBe('new-refresh-token');
    });
  });

  // ─── Refresh failure ───────────────────────────────────────────────────────

  describe('refresh failure', () => {
    it('calls clearAuth() when refresh token endpoint returns 401', async () => {
      mockAxios.onGet('/students').replyOnce(401);
      mockAxios.onPost('/auth/refresh').reply(401, { message: 'Refresh token expired' });

      try {
        await httpClient.get('/students');
      } catch {
        // Expected to throw
      }

      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('redirects to /login after clearAuth() on refresh failure', async () => {
      const mockReplace = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { replace: mockReplace, href: '' },
        writable: true,
      });

      mockAxios.onGet('/students').replyOnce(401);
      mockAxios.onPost('/auth/refresh').reply(401);

      try {
        await httpClient.get('/students');
      } catch {
        // Expected
      }

      expect(mockReplace).toHaveBeenCalledWith('/login');
    });

    it('calls clearAuth() when refresh token endpoint returns 403', async () => {
      mockAxios.onGet('/students').replyOnce(401);
      mockAxios.onPost('/auth/refresh').reply(403, { message: 'Forbidden' });

      try {
        await httpClient.get('/students');
      } catch {
        // Expected to throw
      }

      expect(useAuthStore.getState().accessToken).toBeNull();
    });
  });

  // ─── Concurrent 401 handling (failedQueue pattern) ─────────────────────────

  describe('concurrent 401 handling (failedQueue pattern)', () => {
    it('sends only one refresh request for multiple simultaneous 401s', async () => {
      let refreshCallCount = 0;

      mockAxios.onGet('/students').replyOnce(401);
      mockAxios.onGet('/courses').replyOnce(401);
      mockAxios.onGet('/teachers').replyOnce(401);

      mockAxios.onPost('/auth/refresh').reply(() => {
        refreshCallCount++;
        return [200, newTokens];
      });

      mockAxios.onGet('/students').reply(200, []);
      mockAxios.onGet('/courses').reply(200, []);
      mockAxios.onGet('/teachers').reply(200, []);

      await Promise.allSettled([
        httpClient.get('/students'),
        httpClient.get('/courses'),
        httpClient.get('/teachers'),
      ]);

      // Only ONE refresh call should have been made (failedQueue pattern)
      expect(refreshCallCount).toBe(1);
    });

    it('all queued requests use the new token after single refresh', async () => {
      const authHeaders: string[] = [];

      mockAxios.onGet('/students').replyOnce(401);
      mockAxios.onGet('/courses').replyOnce(401);
      mockAxios.onPost('/auth/refresh').reply(200, newTokens);
      mockAxios.onGet('/students').reply((config) => {
        authHeaders.push((config.headers?.['Authorization'] as string) ?? '');
        return [200, []];
      });
      mockAxios.onGet('/courses').reply((config) => {
        authHeaders.push((config.headers?.['Authorization'] as string) ?? '');
        return [200, []];
      });

      await Promise.allSettled([
        httpClient.get('/students'),
        httpClient.get('/courses'),
      ]);

      authHeaders.forEach((header) => {
        expect(header).toContain('new-access-token');
      });
    });

    it('all queued requests fail when refresh fails', async () => {
      mockAxios.onGet('/students').replyOnce(401);
      mockAxios.onGet('/courses').replyOnce(401);
      mockAxios.onPost('/auth/refresh').reply(401);

      const results = await Promise.allSettled([
        httpClient.get('/students'),
        httpClient.get('/courses'),
      ]);

      results.forEach((result) => {
        expect(result.status).toBe('rejected');
      });
    });
  });
});

// ─── Helper: allow act() usage outside React component context ────────────────
function act(fn: () => void): void {
  fn();
}