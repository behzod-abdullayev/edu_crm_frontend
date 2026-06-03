import { useState, useEffect, useCallback, useRef } from 'react';
import { useUIStore } from '@/store/ui.store';

type QueuedFn = () => Promise<unknown>;

const QUEUE_STORAGE_KEY = 'educrm-offline-queue-meta';

interface UseOfflineRetryReturn {
  isOffline: boolean;
  queueMutation: <T>(fn: () => Promise<T>) => Promise<T>;
  retryQueue: () => Promise<void>;
  queueSize: number;
}

export function useOfflineRetry(): UseOfflineRetryReturn {
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false,
  );
  const queueRef = useRef<QueuedFn[]>([]);
  const [queueSize, setQueueSize] = useState<number>(0);
  const { setOffline, incrementOfflineQueue, decrementOfflineQueue } =
    useUIStore.getState();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOffline(false);
      setOffline(false);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOffline]);

  const queueMutation = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T> => {
      if (!isOffline) {
        return fn();
      }

      return new Promise<T>((resolve, reject) => {
        const wrapped: QueuedFn = async () => {
          try {
            const result = await fn();
            resolve(result);
          } catch (err: unknown) {
            reject(err);
          }
        };

        queueRef.current.push(wrapped);
        setQueueSize((s) => s + 1);
        incrementOfflineQueue();

        // Persist queue size to localStorage
        try {
          localStorage.setItem(
            QUEUE_STORAGE_KEY,
            JSON.stringify({ count: queueRef.current.length }),
          );
        } catch {
          // ignore
        }
      });
    },
    [isOffline, incrementOfflineQueue],
  );

  const retryQueue = useCallback(async () => {
    const fns = [...queueRef.current];
    queueRef.current = [];
    setQueueSize(0);

    for (const fn of fns) {
      try {
        await fn();
      } catch {
        // Re-queue failed items
        queueRef.current.push(fn);
        setQueueSize((s) => s + 1);
      } finally {
        decrementOfflineQueue();
      }
    }

    try {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [decrementOfflineQueue]);

  // Auto-retry when coming back online
  useEffect(() => {
    if (!isOffline && queueRef.current.length > 0) {
      retryQueue();
    }
  }, [isOffline, retryQueue]);

  return { isOffline, queueMutation, retryQueue, queueSize };
}
