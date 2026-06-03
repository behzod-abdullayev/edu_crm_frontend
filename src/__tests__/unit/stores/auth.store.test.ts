import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useAuthStore } from '@/store/auth.store';
import type { AuthTokens, UserProfile } from '@/services/api/auth.api';

// Mock the authApi module
vi.mock('@/services/api/auth.api', () => ({
  authApi: {
    getMe: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  },
}));

import { authApi } from '@/services/api/auth.api';

const mockUser: UserProfile = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'student',
  permissions: [],
  tenantId: 'tenant-1',
  isActive: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

const mockTokens: AuthTokens = {
  accessToken: 'access-token-123',
  refreshToken: 'refresh-token-456',
  expiresIn: 3600,
};

describe('useAuthStore', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.getState().clearAuth();
    });
    vi.clearAllMocks();
  });

  describe('setTokens()', () => {
    it('stores access token correctly', () => {
      act(() => {
        useAuthStore.getState().setTokens(mockTokens);
      });
      expect(useAuthStore.getState().accessToken).toBe('access-token-123');
    });

    it('stores refresh token correctly', () => {
      act(() => {
        useAuthStore.getState().setTokens(mockTokens);
      });
      expect(useAuthStore.getState().refreshToken).toBe('refresh-token-456');
    });

    it('replaces existing tokens when called again', () => {
      const newTokens: AuthTokens = {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        expiresIn: 3600,
      };
      act(() => {
        useAuthStore.getState().setTokens(mockTokens);
        useAuthStore.getState().setTokens(newTokens);
      });
      expect(useAuthStore.getState().accessToken).toBe('new-access');
      expect(useAuthStore.getState().refreshToken).toBe('new-refresh');
    });
  });

  describe('setUser()', () => {
    it('stores user object correctly', () => {
      act(() => {
        useAuthStore.getState().setUser(mockUser);
      });
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });
  });

  describe('clearAuth()', () => {
    it('resets accessToken to null', () => {
      act(() => {
        useAuthStore.getState().setTokens(mockTokens);
        useAuthStore.getState().clearAuth();
      });
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('resets refreshToken to null', () => {
      act(() => {
        useAuthStore.getState().setTokens(mockTokens);
        useAuthStore.getState().clearAuth();
      });
      expect(useAuthStore.getState().refreshToken).toBeNull();
    });

    it('resets user to null', () => {
      act(() => {
        useAuthStore.getState().setUser(mockUser);
        useAuthStore.getState().clearAuth();
      });
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('resets isAuthenticated to false', () => {
      act(() => {
        useAuthStore.getState().setTokens(mockTokens);
        useAuthStore.getState().setUser(mockUser);
        useAuthStore.getState().clearAuth();
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('is false when no tokens and no user', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('is false when tokens set but no user', () => {
      act(() => {
        useAuthStore.getState().setTokens(mockTokens);
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('is false when user set but no access token', () => {
      act(() => {
        useAuthStore.getState().setUser(mockUser);
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('is true when both accessToken and user are set', () => {
      act(() => {
        useAuthStore.getState().setTokens(mockTokens);
        useAuthStore.getState().setUser(mockUser);
      });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
  });

  describe('syncMe()', () => {
    it('calls authApi.getMe() when access token exists', async () => {
      vi.mocked(authApi.getMe).mockResolvedValueOnce(mockUser);
      act(() => {
        useAuthStore.getState().setTokens(mockTokens);
      });
      await act(async () => {
        await useAuthStore.getState().syncMe();
      });
      expect(authApi.getMe).toHaveBeenCalledTimes(1);
    });

    it('sets user from getMe() response', async () => {
      vi.mocked(authApi.getMe).mockResolvedValueOnce(mockUser);
      act(() => {
        useAuthStore.getState().setTokens(mockTokens);
      });
      await act(async () => {
        await useAuthStore.getState().syncMe();
      });
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('does NOT call authApi.getMe() when no access token', async () => {
      await act(async () => {
        await useAuthStore.getState().syncMe();
      });
      expect(authApi.getMe).not.toHaveBeenCalled();
    });

    it('calls clearAuth() when getMe() throws', async () => {
      vi.mocked(authApi.getMe).mockRejectedValueOnce(new Error('Unauthorized'));
      act(() => {
        useAuthStore.getState().setTokens(mockTokens);
      });
      await act(async () => {
        await useAuthStore.getState().syncMe();
      });
      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().accessToken).toBeNull();
    });
  });

  describe('persist middleware', () => {
    it('tokens are stored in localStorage via persist', () => {
      act(() => {
        useAuthStore.getState().setTokens(mockTokens);
      });
      const stored = localStorage.getItem('educrm-auth');
      expect(stored).not.toBeNull();
      if (stored) {
        const parsed = JSON.parse(stored) as { state: { accessToken: string } };
        expect(parsed.state.accessToken).toBe('access-token-123');
      }
    });
  });
});