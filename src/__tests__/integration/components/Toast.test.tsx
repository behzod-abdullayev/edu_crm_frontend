import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

// Toast lives in Toast.ts barrel, ToastContainer in ToastContainer.ts barrel
import { Toast }          from '@/shared/components/Toast/Toast';
import { ToastContainer } from '@/shared/components/Toast/ToastContainer';
import { useUIStore }     from '@/store/ui.store';
// Toast component accepts @/shared/types Toast (variant + onDismiss)
import type { Toast as ToastType } from '@/shared/types';

expect.extend(toHaveNoViolations);

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      layout: _l,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// ─── Helper ───────────────────────────────────────────────────────────────────
// exactOptionalPropertyTypes: true — NEVER pass `key: undefined`
// Only pass fields that actually have a value.
function makeToast(overrides: Partial<ToastType> = {}): ToastType {
  return {
    id: 'toast-test-1',
    variant: 'info',
    title: 'Default toast title',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast component — unit tests
// @/shared/types Toast: { id, variant?, title?, description?, duration?, onDismiss? }
// ─────────────────────────────────────────────────────────────────────────────

describe('Toast component', () => {

  describe('title rendering', () => {
    it('renders success toast with title', () => {
      render(<Toast toast={makeToast({ variant: 'success', title: 'Saved successfully' })} />);
      expect(screen.getByText('Saved successfully')).toBeInTheDocument();
    });

    it('renders error toast with title', () => {
      render(<Toast toast={makeToast({ variant: 'error', title: 'Something went wrong' })} />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders warning toast with title', () => {
      render(<Toast toast={makeToast({ variant: 'warning', title: 'Check your input' })} />);
      expect(screen.getByText('Check your input')).toBeInTheDocument();
    });

    it('renders info toast with title', () => {
      render(<Toast toast={makeToast({ variant: 'info', title: 'Update available' })} />);
      expect(screen.getByText('Update available')).toBeInTheDocument();
    });
  });

  describe('description', () => {
    it('renders description when provided', () => {
      render(
        <Toast
          toast={makeToast({
            title: 'Upload complete',
            description: 'Your file was uploaded successfully.',
          })}
        />
      );
      expect(screen.getByText('Your file was uploaded successfully.')).toBeInTheDocument();
    });

    it('renders both title and description', () => {
      render(
        <Toast
          toast={makeToast({
            title: 'Profile updated',
            description: 'Your changes have been saved.',
          })}
        />
      );
      expect(screen.getByText('Profile updated')).toBeInTheDocument();
      expect(screen.getByText('Your changes have been saved.')).toBeInTheDocument();
    });

    it('does not render description paragraph when not provided', () => {
      // Do NOT pass description at all — exactOptionalPropertyTypes forbids `description: undefined`
      render(<Toast toast={makeToast({ title: 'Done' })} />);
      expect(screen.queryByText(/saved|uploaded/i)).not.toBeInTheDocument();
    });
  });

  describe('dismiss button', () => {
    it('renders dismiss/close button', () => {
      render(<Toast toast={makeToast()} />);
      expect(screen.getByRole('button', { name: /dismiss|close|yopish/i })).toBeInTheDocument();
    });

    it('calls onDismiss callback when close button is clicked', async () => {
      const onDismiss = vi.fn();
      const user = userEvent.setup();
      render(<Toast toast={makeToast({ onDismiss })} />);
      await user.click(screen.getByRole('button', { name: /dismiss|close|yopish/i }));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not throw when onDismiss is not provided', async () => {
      const user = userEvent.setup();
      // No onDismiss field — not even undefined (exactOptionalPropertyTypes)
      render(<Toast toast={makeToast()} />);
      const btn = screen.getByRole('button', { name: /dismiss|close|yopish/i });
      await expect(user.click(btn)).resolves.not.toThrow();
    });
  });

  describe('ARIA attributes', () => {
    it('has role="alert"', () => {
      render(<Toast toast={makeToast()} />);
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('uses aria-live="assertive" for error toasts', () => {
      render(<Toast toast={makeToast({ variant: 'error', title: 'Error!' })} />);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    });

    it('uses aria-live="polite" for success toasts', () => {
      render(<Toast toast={makeToast({ variant: 'success', title: 'Done!' })} />);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });

    it('uses aria-live="polite" for info toasts', () => {
      render(<Toast toast={makeToast({ variant: 'info', title: 'Note' })} />);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });

    it('uses aria-live="polite" for warning toasts', () => {
      render(<Toast toast={makeToast({ variant: 'warning', title: 'Warning' })} />);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });

    it('close button has accessible aria-label', () => {
      render(<Toast toast={makeToast()} />);
      const btn = screen.getByRole('button', { name: /dismiss|close|yopish/i });
      expect(btn).toHaveAttribute('aria-label');
    });

    it('decorative icons are aria-hidden', () => {
      const { container } = render(<Toast toast={makeToast()} />);
      const hiddenIcons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('passes axe check for success toast', async () => {
      const { container } = render(
        <Toast toast={makeToast({ variant: 'success', title: 'Saved' })} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe check for error toast', async () => {
      const { container } = render(
        <Toast toast={makeToast({ variant: 'error', title: 'Failed' })} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe check for warning toast with description', async () => {
      const { container } = render(
        <Toast
          toast={makeToast({
            variant: 'warning',
            title: 'Low storage',
            description: 'You are running low on disk space.',
          })}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe check for info toast', async () => {
      const { container } = render(
        <Toast toast={makeToast({ variant: 'info', title: 'FYI' })} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ToastContainer + useUIStore integration
// ─────────────────────────────────────────────────────────────────────────────

describe('ToastContainer + useUIStore', () => {
  beforeEach(() => {
    act(() => {
      useUIStore.getState().reset();
    });
  });

  it('renders nothing when toast store is empty', () => {
    render(<ToastContainer />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders toast after addToast(success) call', () => {
    render(<ToastContainer />);
    act(() => {
      useUIStore.getState().addToast({ type: 'success', title: 'File saved' });
    });
    expect(screen.getByText('File saved')).toBeInTheDocument();
  });

  it('renders toast after addToast(error) call', () => {
    render(<ToastContainer />);
    act(() => {
      useUIStore.getState().addToast({ type: 'error', title: 'Network error' });
    });
    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('removes toast from DOM after removeToast', () => {
    render(<ToastContainer />);
    act(() => {
      useUIStore.getState().addToast({ type: 'info', title: 'Temporary' });
    });
    const id = useUIStore.getState().toasts[0]?.id ?? '';
    expect(screen.getByText('Temporary')).toBeInTheDocument();
    act(() => {
      useUIStore.getState().removeToast(id);
    });
    expect(screen.queryByText('Temporary')).not.toBeInTheDocument();
  });

  it('renders toast with description', () => {
    render(<ToastContainer />);
    act(() => {
      useUIStore.getState().addToast({
        type: 'info',
        title: 'Upload started',
        description: 'Your file is being processed.',
      });
    });
    expect(screen.getByText('Upload started')).toBeInTheDocument();
    expect(screen.getByText('Your file is being processed.')).toBeInTheDocument();
  });

  it('keeps at most 3 toasts when 4+ are added', () => {
    render(<ToastContainer />);
    act(() => {
      useUIStore.getState().addToast({ type: 'info', title: 'Toast 1' });
      useUIStore.getState().addToast({ type: 'info', title: 'Toast 2' });
      useUIStore.getState().addToast({ type: 'info', title: 'Toast 3' });
      useUIStore.getState().addToast({ type: 'info', title: 'Toast 4' });
    });
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeLessThanOrEqual(3);
  });

  it('passes axe check for the container with a toast', async () => {
    const { container } = render(<ToastContainer />);
    act(() => {
      useUIStore.getState().addToast({ type: 'success', title: 'Accessible' });
    });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});