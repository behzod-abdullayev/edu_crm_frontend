'use client';

import { useUIStore } from '@/store/ui.store';
import type { Toast } from '@/store/ui.store';

type ToastInput = Omit<Toast, 'id' | 'type'> & { type?: Toast['type'] };

/**
 * Convenience hook that wraps UIStore addToast with a simpler API.
 * Usage: const { toast } = useToast();
 *        toast({ title: 'Saved!', type: 'success' });
 */
export function useToast() {
  const addToast = useUIStore((s) => s.addToast);
  const removeToast = useUIStore((s) => s.removeToast);

  function toast(input: ToastInput) {
    addToast({ type: 'info', ...input });
  }

  toast.success = (title: string, description?: string) => {
    if (description !== undefined) {
      addToast({ type: 'success', title, description });
    } else {
      addToast({ type: 'success', title });
    }
  };

  toast.error = (title: string, description?: string) => {
    if (description !== undefined) {
      addToast({ type: 'error', title, description });
    } else {
      addToast({ type: 'error', title });
    }
  };

  toast.warning = (title: string, description?: string) => {
    if (description !== undefined) {
      addToast({ type: 'warning', title, description });
    } else {
      addToast({ type: 'warning', title });
    }
  };

  toast.info = (title: string, description?: string) => {
    if (description !== undefined) {
      addToast({ type: 'info', title, description });
    } else {
      addToast({ type: 'info', title });
    }
  };

  return { toast, removeToast };
}
