'use client';

import { useEffect, type ReactNode } from 'react';
import { socketClient } from '@/services/websocket/socket.client';
import { useGlobalSocketHandlers } from '@/services/websocket/useSocket';
import { useAuthStore } from '@/store/auth.store';
import { useTenantStore } from '@/store/tenant.store';

// ─── SocketHandlers ───────────────────────────────────────────────────────────
// Rendered only when authenticated. Wires all global cache-patching handlers.

function SocketHandlers(): null {
  useGlobalSocketHandlers();
  return null;
}

// ─── SocketProvider ───────────────────────────────────────────────────────────

interface SocketProviderProps {
  children: ReactNode;
}

/**
 * Manages the socket.io connection lifecycle:
 * - Connects when the user is authenticated and tenantId is available
 * - Disconnects on logout or tenantId change
 * - Re-connects automatically when accessToken rotates (token refresh)
 *
 * Renders <SocketHandlers /> only while authenticated to ensure
 * useGlobalSocketHandlers() can safely call useQueryClient().
 */
export function SocketProvider({ children }: SocketProviderProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const tenantId = useTenantStore((s) => s.tenantId);

  useEffect(() => {
    if (isAuthenticated && accessToken && tenantId) {
      // (Re-)connect whenever token or tenantId changes.
      // socketClient.connect() is idempotent when already connected
      // with the same socket, but calling it again with a new token
      // (after refresh) will re-authenticate.
      socketClient.connect(accessToken, tenantId);
    } else {
      socketClient.disconnect();
    }

    return () => {
      // Cleanup on unmount (app teardown)
      socketClient.disconnect();
    };
  }, [isAuthenticated, accessToken, tenantId]);

  return (
    <>
      {/*
       * SocketHandlers must be inside the return tree so it benefits from
       * the same QueryClient context provided by <QueryProvider> above in
       * the AppProviders tree.
       */}
      {isAuthenticated && <SocketHandlers />}
      {children}
    </>
  );
}