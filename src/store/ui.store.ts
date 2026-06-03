import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  globalSearchOpen: boolean;
  commandPaletteOpen: boolean;
  toasts: Toast[];
  activeModal: string | null;
  isOffline: boolean;
  offlineQueueCount: number;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setSidebarMobileOpen: (v: boolean) => void;
  setTheme: (t: 'light' | 'dark' | 'system') => void;
  openSearch: () => void;
  closeSearch: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setModal: (name: string | null) => void;
  setOffline: (v: boolean) => void;
  incrementOfflineQueue: () => void;
  decrementOfflineQueue: () => void;
  reset: () => void;
}

type UIStore = UIState & UIActions;

let toastIdCounter = 0;

function generateToastId(): string {
  toastIdCounter += 1;
  return `toast-${Date.now()}-${toastIdCounter}`;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // State
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      theme: 'system',
      globalSearchOpen: false,
      commandPaletteOpen: false,
      toasts: [],
      activeModal: null,
      isOffline: false,
      offlineQueueCount: 0,

      // Actions
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (v: boolean) => set({ sidebarCollapsed: v }),

      setSidebarMobileOpen: (v: boolean) => set({ sidebarMobileOpen: v }),

      setTheme: (t: 'light' | 'dark' | 'system') => set({ theme: t }),

      openSearch: () =>
        set({ globalSearchOpen: true, commandPaletteOpen: false }),

      closeSearch: () => set({ globalSearchOpen: false }),

      openCommandPalette: () =>
        set({ commandPaletteOpen: true, globalSearchOpen: false }),

      closeCommandPalette: () => set({ commandPaletteOpen: false }),

      addToast: (toast: Omit<Toast, 'id'>) => {
        const id = generateToastId();
        set((state) => ({
          toasts: [...state.toasts.slice(-2), { ...toast, id }],
        }));
      },

      removeToast: (id: string) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      setModal: (name: string | null) => set({ activeModal: name }),

      setOffline: (v: boolean) => set({ isOffline: v }),

      incrementOfflineQueue: () =>
        set((state) => ({ offlineQueueCount: state.offlineQueueCount + 1 })),

      decrementOfflineQueue: () =>
        set((state) => ({
          offlineQueueCount: Math.max(0, state.offlineQueueCount - 1),
        })),

      reset: () =>
        set({
          sidebarCollapsed: false,
          sidebarMobileOpen: false,
          globalSearchOpen: false,
          commandPaletteOpen: false,
          toasts: [],
          activeModal: null,
          isOffline: false,
          offlineQueueCount: 0,
        }),
    }),
    {
      name: 'educrm-ui',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : ({} as Storage),
      ),
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    },
  ),
);

/** @deprecated Use useUIStore instead */
export const useUiStore = useUIStore;
