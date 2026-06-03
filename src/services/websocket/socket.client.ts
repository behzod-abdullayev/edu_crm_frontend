'use client';

import { io, type Socket } from 'socket.io-client';
import { SocketEvent, type SocketEventPayloadMap } from './socket.events';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

interface EventCacheEntry {
  id: string;
  timestamp: number;
}

type RawSocketPayload<E extends SocketEvent> = SocketEventPayloadMap[E] & {
  _eventId?: string;
};

/**
 * Loose socket alias.
 * socket.io-client's generic FallbackToUntypedListener type causes
 * TypeScript errors when we pass typed event strings to `.on()` / `.off()`.
 * We intentionally widen to `any` here — the type safety lives in the
 * public `on<E>` / `off<E>` API which is fully typed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseSocket = Socket<any, any>;

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_RECONNECT_ATTEMPTS = 5;
/** Window in ms within which duplicate event IDs are suppressed. */
const DEDUP_WINDOW_MS = 5_000;
/** Max entries kept in the dedup ring buffer. */
const DEDUP_MAX_ENTRIES = 50;

// ─── SocketClient ─────────────────────────────────────────────────────────────

class SocketClient {
  private socket: LooseSocket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private eventCache: EventCacheEntry[] = [];

  // ── Public getters ──────────────────────────────────────────────────────────

  get isConnected(): boolean {
    return this.connectionState === 'connected';
  }

  get state(): ConnectionState {
    return this.connectionState;
  }

  // ── connect ─────────────────────────────────────────────────────────────────

  /**
   * Open (or re-open) the socket connection.
   *
   * - Idempotent: calling while already connected is a no-op.
   * - Calling with a new token (after token refresh) tears down the old
   *   connection and opens a fresh one so the server re-authenticates.
   */
  connect(token: string, tenantId: string): void {
    // Already connected — nothing to do.
    if (this.socket?.connected) return;

    // Stale disconnected socket — clean up before reconnecting.
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    this.connectionState = 'connecting';
    this.reconnectAttempts = 0;

    const wsUrl = process.env['NEXT_PUBLIC_WS_URL'] ?? '';

    this.socket = io(wsUrl, {
      auth: { token },
      extraHeaders: { 'X-Tenant-ID': tenantId },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 30_000,
      randomizationFactor: 0.5,
      timeout: 10_000,
    }) as LooseSocket;

    this.socket.on('connect', () => {
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (_reason: string) => {
      this.connectionState = 'disconnected';
    });

    this.socket.on('connect_error', (_err: Error) => {
      this.reconnectAttempts += 1;
      this.connectionState =
        this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS ? 'error' : 'connecting';
    });

    this.socket.on('reconnect', () => {
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
    });

    this.socket.on('reconnect_failed', () => {
      this.connectionState = 'error';
    });
  }

  // ── disconnect ──────────────────────────────────────────────────────────────

  /** Tear down the connection and reset all state. */
  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionState = 'disconnected';
    this.reconnectAttempts = 0;
    this.clearEventCache();
  }

  // ── on ──────────────────────────────────────────────────────────────────────

  /**
   * Subscribe to a typed socket event.
   *
   * Duplicate events (same `_eventId` within DEDUP_WINDOW_MS) are silently
   * dropped so UI components never double-process the same payload.
   */
  on<E extends SocketEvent>(
    event: E,
    handler: (data: SocketEventPayloadMap[E]) => void,
  ): void {
    if (!this.socket) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.socket.on(event as any, (raw: RawSocketPayload<E>) => {
      // Build a deterministic dedup key.
      // Backend should include `_eventId`; fall back to a content-hash.
      const eventId: string = raw._eventId ?? `${event}::${JSON.stringify(raw)}`;

      if (this.isDuplicate(eventId)) return;
      this.trackEvent(eventId);

      handler(raw);
    });
  }

  // ── off ─────────────────────────────────────────────────────────────────────

  /**
   * Unsubscribe from a typed socket event.
   *
   * @param event   - SocketEvent enum value
   * @param handler - The exact handler reference passed to `on()`.
   *                  Omit to remove **all** listeners for the event.
   */
  off<E extends SocketEvent>(
    event: E,
    handler?: (data: SocketEventPayloadMap[E]) => void,
  ): void {
    if (!this.socket) return;

    if (handler) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.socket.off(event as any, handler as any);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.socket.off(event as any);
    }
  }

  // ── emit ────────────────────────────────────────────────────────────────────

  /**
   * Emit an event to the server.
   * Silently dropped if the socket is not currently connected.
   */
  emit(event: string, data?: unknown): void {
    if (!this.socket?.connected) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.socket.emit(event as any, data);
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private isDuplicate(id: string): boolean {
    const now = Date.now();
    return this.eventCache.some(
      (entry) => entry.id === id && now - entry.timestamp < DEDUP_WINDOW_MS,
    );
  }

  private trackEvent(id: string): void {
    const now = Date.now();
    // Prune expired entries and enforce the ring buffer size limit.
    this.eventCache = this.eventCache
      .filter((entry) => now - entry.timestamp < DEDUP_WINDOW_MS)
      .slice(-(DEDUP_MAX_ENTRIES - 1));
    this.eventCache.push({ id, timestamp: now });
  }

  private clearEventCache(): void {
    this.eventCache = [];
  }
}

// ─── Singleton export ─────────────────────────────────────────────────────────

/**
 * Application-wide singleton socket client.
 *
 * Import and use directly in hooks and providers:
 *
 *   import { socketClient } from '@/services/websocket/socket.client';
 *
 *   socketClient.connect(token, tenantId);
 *   socketClient.on(SocketEvent.NOTIFICATION_NEW, handler);
 *   socketClient.disconnect();
 */
export const socketClient = new SocketClient();
