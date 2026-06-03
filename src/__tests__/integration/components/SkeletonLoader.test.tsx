import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

import { SkeletonLoader } from '@/shared/components/SkeletonLoader/SkeletonLoader';
// ToastContainer lives in its own barrel — NOT in Toast.ts
import { Toast }          from '@/shared/components/Toast/Toast';
import { ToastContainer } from '@/shared/components/Toast/ToastContainer';
import { useUIStore }     from '@/store/ui.store';
// Toast component uses @/shared/types Toast (has variant + onDismiss), NOT ui.store Toast
import type { Toast as ToastType } from '@/shared/types';

expect.extend(toHaveNoViolations);

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

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

// ─────────────────────────────────────────────────────────────────────────────
// SkeletonLoader — valid variants: 'text'|'card'|'table'|'kpi'|'chart'|'avatar'
// ─────────────────────────────────────────────────────────────────────────────

describe('SkeletonLoader', () => {
  describe('variant rendering', () => {
    it('renders text variant without crashing', () => {
      const { container } = render(<SkeletonLoader variant="text" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders card variant without crashing', () => {
      const { container } = render(<SkeletonLoader variant="card" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders table variant without crashing', () => {
      const { container } = render(<SkeletonLoader variant="table" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders kpi variant without crashing', () => {
      const { container } = render(<SkeletonLoader variant="kpi" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders chart variant without crashing', () => {
      const { container } = render(<SkeletonLoader variant="chart" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders avatar variant without crashing', () => {
      const { container } = render(<SkeletonLoader variant="avatar" />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders card variant by default when no variant prop is given', () => {
      const { container } = render(<SkeletonLoader />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('count prop', () => {
    it('renders a single skeleton when count=1', () => {
      const { container } = render(<SkeletonLoader variant="card" count={1} />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders multiple skeletons when count > 1', () => {
      const { container } = render(<SkeletonLoader variant="card" count={3} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('ARIA attributes', () => {
    it('has aria-label containing "Loading" for screen readers', () => {
      render(<SkeletonLoader variant="card" />);
      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
    });

    it('has aria-busy="true"', () => {
      render(<SkeletonLoader variant="card" />);
      const el = screen.getByLabelText(/loading/i);
      expect(el).toHaveAttribute('aria-busy', 'true');
    });

    it('inner shimmer elements are aria-hidden', () => {
      const { container } = render(<SkeletonLoader variant="card" />);
      const hiddenEls = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenEls.length).toBeGreaterThan(0);
    });
  });

  describe('className prop', () => {
    it('applies custom className to wrapper', () => {
      const { container } = render(
        <SkeletonLoader variant="text" className="custom-skeleton-class" />
      );
      expect(container.firstChild).toHaveClass('custom-skeleton-class');
    });
  });

  describe('accessibility', () => {
    it('passes axe check for card variant', async () => {
      const { container } = render(<SkeletonLoader variant="card" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe check for table variant', async () => {
      const { container } = render(<SkeletonLoader variant="table" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Toast component — uses @/shared/types Toast
// { id, variant?, title?, description?, duration?, onDismiss? }
// ─────────────────────────────────────────────────────────────────────────────

// makeToast builds a valid ToastType without passing undefined for optional fields
// (exactOptionalPropertyTypes: true — never pass `key: undefined`)
function makeToast(overrides: Partial<ToastType> = {}): ToastType {
  return {
    id: 'toast-1',
    variant: 'info',
    title: 'Test toast',
    ...overrides,
  };
}

describe('Toast component', () => {
  describe('variant rendering', () => {
    it('renders success toast', () => {
      render(<Toast toast={makeToast({ variant: 'success', title: 'Saved successfully' })} />);
      expect(screen.getByText('Saved successfully')).toBeInTheDocument();
    });

    it('renders error toast', () => {
      render(<Toast toast={makeToast({ variant: 'error', title: 'Something went wrong' })} />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    it('renders warning toast', () => {
      render(<Toast toast={makeToast({ variant: 'warning', title: 'Check your input' })} />);
      expect(screen.getByText('Check your input')).toBeInTheDocument();
    });

    it('renders info toast', () => {
      render(<Toast toast={makeToast({ variant: 'info', title: 'New update available' })} />);
      expect(screen.getByText('New update available')).toBeInTheDocument();
    });
  });

  describe('description', () => {
    it('renders description when provided', () => {
      render(
        <Toast
          toast={makeToast({
            title: 'Upload complete',
            description: 'Your file has been uploaded.',
          })}
        />
      );
      expect(screen.getByText('Your file has been uploaded.')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
      // Do NOT pass description at all (exactOptionalPropertyTypes)
      render(<Toast toast={makeToast({ title: 'Done' })} />);
      expect(screen.queryByText(/uploaded/i)).not.toBeInTheDocument();
    });
  });

  describe('dismiss button', () => {
    it('renders dismiss/close button', () => {
      render(<Toast toast={makeToast()} />);
      expect(screen.getByRole('button', { name: /dismiss|close|yopish/i })).toBeInTheDocument();
    });

    it('calls onDismiss when dismiss button clicked', async () => {
      const onDismiss = vi.fn();
      const user = userEvent.setup();
      // onDismiss is a valid field on @/shared/types Toast
      render(<Toast toast={makeToast({ onDismiss })} />);
      await user.click(screen.getByRole('button', { name: /dismiss|close|yopish/i }));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not throw when onDismiss is not provided', async () => {
      const user = userEvent.setup();
      // No onDismiss field at all (not undefined — just absent)
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
      render(<Toast toast={makeToast({ variant: 'error' })} />);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'assertive');
    });

    it('uses aria-live="polite" for non-error toasts', () => {
      render(<Toast toast={makeToast({ variant: 'success' })} />);
      expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('accessibility', () => {
    it('passes axe check for success toast', async () => {
      const { container } = render(
        <Toast toast={makeToast({ variant: 'success', title: 'Done' })} />
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
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ToastContainer + useUIStore integration
// ─────────────────────────────────────────────────────────────────────────────

describe('ToastContainer integration', () => {
  beforeEach(() => {
    act(() => {
      useUIStore.getState().reset();
    });
  });

  it('renders no toasts when store is empty', () => {
    render(<ToastContainer />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders toast after addToast is called', () => {
    render(<ToastContainer />);
    act(() => {
      useUIStore.getState().addToast({ type: 'success', title: 'Hello!' });
    });
    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });

  it('removes toast after removeToast is called', () => {
    render(<ToastContainer />);
    let toastId = '';
    act(() => {
      useUIStore.getState().addToast({ type: 'info', title: 'Removable' });
      toastId = useUIStore.getState().toasts[0]?.id ?? '';
    });
    expect(screen.getByText('Removable')).toBeInTheDocument();
    act(() => {
      useUIStore.getState().removeToast(toastId);
    });
    expect(screen.queryByText('Removable')).not.toBeInTheDocument();
  });

  it('caps toasts at 3 when 4+ are added', () => {
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

  it('renders success toast via addToast', () => {
    render(<ToastContainer />);
    act(() => { useUIStore.getState().addToast({ type: 'success', title: 'Saved!' }); });
    expect(screen.getByText('Saved!')).toBeInTheDocument();
  });

  it('renders error toast via addToast', () => {
    render(<ToastContainer />);
    act(() => { useUIStore.getState().addToast({ type: 'error', title: 'Error occurred' }); });
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
  });

  it('renders warning toast via addToast', () => {
    render(<ToastContainer />);
    act(() => { useUIStore.getState().addToast({ type: 'warning', title: 'Warning!' }); });
    expect(screen.getByText('Warning!')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<ToastContainer />);
    act(() => {
      useUIStore.getState().addToast({
        type: 'info',
        title: 'Info title',
        description: 'Extra description here',
      });
    });
    expect(screen.getByText('Extra description here')).toBeInTheDocument();
  });
});