import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useUIStore } from '@/store/ui.store';
import type { Toast } from '@/store/ui.store';

// Toast interface: { id, type, title, description?, duration?, action? }
// "message" maydoni yo'q — "title" ishlatiladi

describe('useUIStore', () => {
  beforeEach(() => {
    act(() => {
      useUIStore.getState().reset();
    });
  });

  describe('toggleSidebar()', () => {
    it('sets sidebarCollapsed to true when initially false', () => {
      act(() => {
        useUIStore.setState({ sidebarCollapsed: false });
        useUIStore.getState().toggleSidebar();
      });
      expect(useUIStore.getState().sidebarCollapsed).toBe(true);
    });

    it('sets sidebarCollapsed to false when initially true', () => {
      act(() => {
        useUIStore.setState({ sidebarCollapsed: true });
        useUIStore.getState().toggleSidebar();
      });
      expect(useUIStore.getState().sidebarCollapsed).toBe(false);
    });

    it('toggling twice returns to original value', () => {
      const initial = useUIStore.getState().sidebarCollapsed;
      act(() => {
        useUIStore.getState().toggleSidebar();
        useUIStore.getState().toggleSidebar();
      });
      expect(useUIStore.getState().sidebarCollapsed).toBe(initial);
    });
  });

  describe('addToast()', () => {
    it('adds a toast to the list', () => {
      act(() => {
        useUIStore.getState().addToast({
          type: 'success',
          title: 'Saved successfully',
        });
      });
      expect(useUIStore.getState().toasts).toHaveLength(1);
    });

    it('assigns a generated id to the toast', () => {
      act(() => {
        useUIStore.getState().addToast({
          type: 'success',
          title: 'Hello',
        });
      });
      const toast = useUIStore.getState().toasts[0];
      expect(toast).toBeDefined();
      expect(toast!.id).toBeDefined();
      expect(typeof toast!.id).toBe('string');
      expect(toast!.id.length).toBeGreaterThan(0);
    });

    it('stores the correct title and type', () => {
      act(() => {
        useUIStore.getState().addToast({
          type: 'error',
          title: 'Something went wrong',
        });
      });
      const toast = useUIStore.getState().toasts[0];
      expect(toast).toBeDefined();
      expect(toast!.type).toBe('error');
      expect(toast!.title).toBe('Something went wrong');
    });

    it('stores optional description when provided', () => {
      act(() => {
        useUIStore.getState().addToast({
          type: 'info',
          title: 'Info toast',
          description: 'Additional details here',
        });
      });
      const toast = useUIStore.getState().toasts[0];
      expect(toast).toBeDefined();
      expect(toast!.description).toBe('Additional details here');
    });

    it('can add multiple toasts up to the cap', () => {
      act(() => {
        useUIStore.getState().addToast({ type: 'success', title: 'First' });
        useUIStore.getState().addToast({ type: 'info', title: 'Second' });
        useUIStore.getState().addToast({ type: 'warning', title: 'Third' });
      });
      expect(useUIStore.getState().toasts).toHaveLength(3);
    });

    it('max 3 toasts: adding a fourth does not exceed the cap', () => {
      act(() => {
        useUIStore.getState().addToast({ type: 'success', title: 'First' });
        useUIStore.getState().addToast({ type: 'info', title: 'Second' });
        useUIStore.getState().addToast({ type: 'warning', title: 'Third' });
        useUIStore.getState().addToast({ type: 'error', title: 'Fourth' });
      });
      const toasts = useUIStore.getState().toasts;
      expect(toasts.length).toBeLessThanOrEqual(3);
    });

    it('when fourth toast is added, either oldest is removed or new one is rejected', () => {
      act(() => {
        useUIStore.getState().addToast({ type: 'success', title: 'First' });
        useUIStore.getState().addToast({ type: 'info', title: 'Second' });
        useUIStore.getState().addToast({ type: 'warning', title: 'Third' });
        useUIStore.getState().addToast({ type: 'error', title: 'Fourth' });
      });
      const toasts = useUIStore.getState().toasts;
      const titles = toasts.map((t) => t.title);
      const hasFirst = titles.includes('First');
      const hasFourth = titles.includes('Fourth');
      // Either 'First' is gone (FIFO eviction) OR 'Fourth' was not added
      expect(hasFirst && hasFourth).toBe(false);
    });
  });

  describe('removeToast()', () => {
    it('removes toast by id', () => {
      act(() => {
        useUIStore.getState().addToast({ type: 'success', title: 'Test' });
      });
      const toasts = useUIStore.getState().toasts;
      expect(toasts.length).toBeGreaterThan(0);
      const id = toasts[0]!.id;
      act(() => {
        useUIStore.getState().removeToast(id);
      });
      expect(useUIStore.getState().toasts).toHaveLength(0);
    });

    it('only removes the toast with matching id', () => {
      act(() => {
        useUIStore.getState().addToast({ type: 'success', title: 'Keep me' });
        useUIStore.getState().addToast({ type: 'error', title: 'Remove me' });
      });
      const toasts = useUIStore.getState().toasts;
      const removeId = toasts.find((t) => t.title === 'Remove me')!.id;
      act(() => {
        useUIStore.getState().removeToast(removeId);
      });
      expect(useUIStore.getState().toasts).toHaveLength(1);
      expect(useUIStore.getState().toasts[0]!.title).toBe('Keep me');
    });

    it('does nothing when id not found', () => {
      act(() => {
        useUIStore.getState().addToast({ type: 'info', title: 'Present' });
        useUIStore.getState().removeToast('non-existent-id');
      });
      expect(useUIStore.getState().toasts).toHaveLength(1);
    });
  });

  describe('setOffline()', () => {
    it('sets isOffline to true', () => {
      act(() => {
        useUIStore.getState().setOffline(true);
      });
      expect(useUIStore.getState().isOffline).toBe(true);
    });

    it('sets isOffline to false', () => {
      act(() => {
        useUIStore.setState({ isOffline: true });
        useUIStore.getState().setOffline(false);
      });
      expect(useUIStore.getState().isOffline).toBe(false);
    });
  });

  describe('setTheme()', () => {
    it('sets theme to dark', () => {
      act(() => {
        useUIStore.getState().setTheme('dark');
      });
      expect(useUIStore.getState().theme).toBe('dark');
    });

    it('sets theme to light', () => {
      act(() => {
        useUIStore.getState().setTheme('light');
      });
      expect(useUIStore.getState().theme).toBe('light');
    });

    it('sets theme to system', () => {
      act(() => {
        useUIStore.getState().setTheme('system');
      });
      expect(useUIStore.getState().theme).toBe('system');
    });
  });

  describe('setModal()', () => {
    it('sets activeModal to a string name', () => {
      act(() => {
        useUIStore.getState().setModal('create-student');
      });
      expect(useUIStore.getState().activeModal).toBe('create-student');
    });

    it('clears activeModal when set to null', () => {
      act(() => {
        useUIStore.getState().setModal('some-modal');
        useUIStore.getState().setModal(null);
      });
      expect(useUIStore.getState().activeModal).toBeNull();
    });
  });

  describe('openSearch() / closeSearch()', () => {
    it('sets globalSearchOpen to true', () => {
      act(() => {
        useUIStore.getState().openSearch();
      });
      expect(useUIStore.getState().globalSearchOpen).toBe(true);
    });

    it('sets globalSearchOpen to false', () => {
      act(() => {
        useUIStore.getState().openSearch();
        useUIStore.getState().closeSearch();
      });
      expect(useUIStore.getState().globalSearchOpen).toBe(false);
    });

    it('closing commandPalette when opening search', () => {
      act(() => {
        useUIStore.getState().openCommandPalette();
        useUIStore.getState().openSearch();
      });
      expect(useUIStore.getState().commandPaletteOpen).toBe(false);
      expect(useUIStore.getState().globalSearchOpen).toBe(true);
    });
  });

  describe('incrementOfflineQueue() / decrementOfflineQueue()', () => {
    it('increments offlineQueueCount', () => {
      act(() => {
        useUIStore.getState().incrementOfflineQueue();
      });
      expect(useUIStore.getState().offlineQueueCount).toBe(1);
    });

    it('decrements offlineQueueCount', () => {
      act(() => {
        useUIStore.getState().incrementOfflineQueue();
        useUIStore.getState().incrementOfflineQueue();
        useUIStore.getState().decrementOfflineQueue();
      });
      expect(useUIStore.getState().offlineQueueCount).toBe(1);
    });

    it('does not go below 0', () => {
      act(() => {
        useUIStore.getState().decrementOfflineQueue();
      });
      expect(useUIStore.getState().offlineQueueCount).toBe(0);
    });
  });

  describe('reset()', () => {
    it('clears all toasts', () => {
      act(() => {
        useUIStore.getState().addToast({ type: 'success', title: 'Test' });
        useUIStore.getState().reset();
      });
      expect(useUIStore.getState().toasts).toHaveLength(0);
    });

    it('sets isOffline to false', () => {
      act(() => {
        useUIStore.setState({ isOffline: true });
        useUIStore.getState().reset();
      });
      expect(useUIStore.getState().isOffline).toBe(false);
    });

    it('sets activeModal to null', () => {
      act(() => {
        useUIStore.getState().setModal('test-modal');
        useUIStore.getState().reset();
      });
      expect(useUIStore.getState().activeModal).toBeNull();
    });

    it('sets globalSearchOpen to false', () => {
      act(() => {
        useUIStore.getState().openSearch();
        useUIStore.getState().reset();
      });
      expect(useUIStore.getState().globalSearchOpen).toBe(false);
    });

    it('resets offlineQueueCount to 0', () => {
      act(() => {
        useUIStore.getState().incrementOfflineQueue();
        useUIStore.getState().incrementOfflineQueue();
        useUIStore.getState().reset();
      });
      expect(useUIStore.getState().offlineQueueCount).toBe(0);
    });
  });
});