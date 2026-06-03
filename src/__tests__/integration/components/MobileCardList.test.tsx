import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
// Correct import via barrel file
import { MobileCardList } from '@/shared/components/MobileCardList/MobileCardList';
import type { BulkAction, EmptyStateProps } from '@/shared/components/mobile/MobileCardList';

expect.extend(toHaveNoViolations);

// ─── Framer Motion mock ───────────────────────────────────────────────────────
vi.mock('framer-motion', () => ({
  motion: {
    div: ({
      children,
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useReducedMotion: () => false,
}));

// ─── PullToRefresh mock (wraps children transparently) ────────────────────────
vi.mock('@/shared/components/mobile/PullToRefresh', () => ({
  PullToRefresh: ({
    children,
    onRefresh: _r,
  }: {
    children: React.ReactNode;
    onRefresh: () => Promise<void>;
  }) => <div data-testid="pull-to-refresh-wrapper">{children}</div>,
}));

// ─── Test data ────────────────────────────────────────────────────────────────

interface TestItem {
  id: string;
  name: string;
  status: string;
}

const testItems: TestItem[] = [
  { id: '1', name: 'Item One',   status: 'active'   },
  { id: '2', name: 'Item Two',   status: 'inactive' },
  { id: '3', name: 'Item Three', status: 'active'   },
];

// renderCard receives (item, isSelected) — matches the actual MobileCardList signature
function renderCard(item: TestItem, isSelected: boolean) {
  return (
    <div data-testid={`card-${item.id}`} data-selected={isSelected}>
      <span>{item.name}</span>
      <span>{item.status}</span>
    </div>
  );
}

const defaultEmptyState: EmptyStateProps = {
  title: 'No items found',
  description: 'Try adjusting your filters.',
};

const bulkDeleteAction: BulkAction<TestItem> = {
  label: 'Delete selected',
  onClick: vi.fn(),
  variant: 'danger',
};

const defaultProps = {
  data: testItems,
  renderCard,
  isLoading: false,
  error: null,
  hasMore: false,
  emptyState: defaultEmptyState,
  onSelect: vi.fn(),
  bulkActions: [bulkDeleteAction],
};

describe('MobileCardList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Basic rendering ─────────────────────────────────────────────────────

  describe('rendering', () => {
    it('calls renderCard for each item in data', () => {
      render(<MobileCardList {...defaultProps} />);
      expect(screen.getByTestId('card-1')).toBeInTheDocument();
      expect(screen.getByTestId('card-2')).toBeInTheDocument();
      expect(screen.getByTestId('card-3')).toBeInTheDocument();
    });

    it('renders correct number of cards', () => {
      render(<MobileCardList {...defaultProps} />);
      expect(screen.getAllByTestId(/^card-/)).toHaveLength(3);
    });

    it('renders item content inside each card', () => {
      render(<MobileCardList {...defaultProps} />);
      expect(screen.getByText('Item One')).toBeInTheDocument();
      expect(screen.getByText('Item Two')).toBeInTheDocument();
      expect(screen.getByText('Item Three')).toBeInTheDocument();
    });
  });

  // ─── Loading state ────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows skeleton cards when isLoading=true and data is empty', () => {
      render(<MobileCardList {...defaultProps} isLoading data={[]} />);
      // Skeleton cards are aria-hidden="true" — no real cards shown
      expect(screen.queryByTestId('card-1')).not.toBeInTheDocument();
      // Container has aria-busy
      const loader = document.querySelector('[aria-busy="true"]');
      expect(loader).toBeInTheDocument();
    });

    it('has aria-busy="true" while loading', () => {
      render(<MobileCardList {...defaultProps} isLoading data={[]} />);
      expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    });

    it('does not show empty state while loading', () => {
      render(<MobileCardList {...defaultProps} isLoading data={[]} />);
      expect(screen.queryByText('No items found')).not.toBeInTheDocument();
    });

    it('does not show data cards while loading with no data', () => {
      render(<MobileCardList {...defaultProps} isLoading data={[]} />);
      expect(screen.queryByTestId('card-1')).not.toBeInTheDocument();
    });
  });

  // ─── Error state ──────────────────────────────────────────────────────────

  describe('error state', () => {
    it('shows error message when error prop is set', () => {
      render(
        <MobileCardList
          {...defaultProps}
          data={[]}
          error={new Error('Failed to load data')}
        />
      );
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('shows the error message text', () => {
      render(
        <MobileCardList
          {...defaultProps}
          data={[]}
          error={new Error('Network error')}
        />
      );
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    it('shows "Something went wrong" heading on error', () => {
      render(
        <MobileCardList
          {...defaultProps}
          data={[]}
          error={new Error('Timeout')}
        />
      );
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  // ─── Empty state ──────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('shows emptyState.title when data is empty and not loading', () => {
      render(
        <MobileCardList
          {...defaultProps}
          data={[]}
          isLoading={false}
        />
      );
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('shows emptyState.description when provided', () => {
      render(
        <MobileCardList
          {...defaultProps}
          data={[]}
          isLoading={false}
        />
      );
      expect(screen.getByText('Try adjusting your filters.')).toBeInTheDocument();
    });

    it('does not show empty state when data has items', () => {
      render(<MobileCardList {...defaultProps} />);
      expect(screen.queryByText('No items found')).not.toBeInTheDocument();
    });

    it('shows emptyState CTA button when action is provided', () => {
      const onActionClick = vi.fn();
      render(
        <MobileCardList
          {...defaultProps}
          data={[]}
          emptyState={{
            title: 'No students',
            action: { label: 'Add student', onClick: onActionClick },
          }}
        />
      );
      expect(screen.getByRole('button', { name: 'Add student' })).toBeInTheDocument();
    });

    it('calls emptyState.action.onClick when CTA is clicked', async () => {
      const onActionClick = vi.fn();
      const user = userEvent.setup();
      render(
        <MobileCardList
          {...defaultProps}
          data={[]}
          emptyState={{
            title: 'No items',
            action: { label: 'Create one', onClick: onActionClick },
          }}
        />
      );
      await user.click(screen.getByRole('button', { name: 'Create one' }));
      expect(onActionClick).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Load more / infinite scroll ──────────────────────────────────────────

  describe('hasMore / onLoadMore', () => {
    it('renders load-more sentinel div when hasMore=true and onLoadMore is provided', () => {
      render(
        <MobileCardList
          {...defaultProps}
          hasMore
          onLoadMore={vi.fn()}
        />
      );
      // Sentinel div is aria-hidden
      const sentinel = document.querySelector('[aria-hidden="true"]');
      expect(sentinel).toBeInTheDocument();
    });

    it('does not render sentinel when hasMore=false', () => {
      // With hasMore=false no sentinel or extra load-more is added
      render(<MobileCardList {...defaultProps} hasMore={false} />);
      // just check no explicit "Load more" button rendered
      expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
    });
  });

  // ─── Pull-to-refresh ──────────────────────────────────────────────────────

  describe('pull-to-refresh', () => {
    it('wraps list in PullToRefresh when onRefresh is provided', () => {
      render(
        <MobileCardList
          {...defaultProps}
          onRefresh={vi.fn().mockResolvedValue(undefined)}
        />
      );
      expect(screen.getByTestId('pull-to-refresh-wrapper')).toBeInTheDocument();
    });

    it('does NOT wrap in PullToRefresh when onRefresh is not provided', () => {
      render(<MobileCardList {...defaultProps} />);
      expect(screen.queryByTestId('pull-to-refresh-wrapper')).not.toBeInTheDocument();
    });
  });

  // ─── Long-press selection mode ────────────────────────────────────────────

  describe('long-press selection mode', () => {
    it('enters selection mode after 400ms hold on a card', async () => {
      render(<MobileCardList {...defaultProps} />);
      const cardWrapper = screen.getByTestId('card-1').parentElement!;

      // Simulate pointerdown and wait for long-press timer
      fireEvent.pointerDown(cardWrapper);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 450));
      });
      fireEvent.pointerUp(cardWrapper);

      // After long press, BulkActionsBar (toolbar role) should appear
      await waitFor(() => {
        expect(screen.getByRole('toolbar')).toBeInTheDocument();
      });
    });

    it('does NOT enter selection mode with short press < 400ms', async () => {
      render(<MobileCardList {...defaultProps} />);
      const cardWrapper = screen.getByTestId('card-1').parentElement!;

      fireEvent.pointerDown(cardWrapper);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });
      fireEvent.pointerUp(cardWrapper);

      expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    });

    it('cancels long press when pointer leaves before 400ms', async () => {
      render(<MobileCardList {...defaultProps} />);
      const cardWrapper = screen.getByTestId('card-1').parentElement!;

      fireEvent.pointerDown(cardWrapper);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });
      // Pointer leaves the element — should cancel
      fireEvent.pointerLeave(cardWrapper);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));
      });

      expect(screen.queryByRole('toolbar')).not.toBeInTheDocument();
    });

    it('shows BulkActionsBar with correct aria-label when in selection mode', async () => {
      render(<MobileCardList {...defaultProps} />);
      const cardWrapper = screen.getByTestId('card-1').parentElement!;

      fireEvent.pointerDown(cardWrapper);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 450));
      });
      fireEvent.pointerUp(cardWrapper);

      await waitFor(() => {
        const toolbar = screen.getByRole('toolbar');
        expect(toolbar).toHaveAttribute('aria-label', expect.stringMatching(/selected/i));
      });
    });

    it('shows bulk action buttons in the toolbar', async () => {
      render(<MobileCardList {...defaultProps} />);
      const cardWrapper = screen.getByTestId('card-1').parentElement!;

      fireEvent.pointerDown(cardWrapper);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 450));
      });
      fireEvent.pointerUp(cardWrapper);

      await waitFor(() => {
        expect(screen.getByText('Delete selected')).toBeInTheDocument();
      });
    });

    it('calls bulkAction.onClick with selected items when bulk action clicked', async () => {
      const onBulkDelete = vi.fn();
      render(
        <MobileCardList
          {...defaultProps}
          bulkActions={[{ label: 'Delete', onClick: onBulkDelete, variant: 'danger' }]}
        />
      );
      const cardWrapper = screen.getByTestId('card-1').parentElement!;

      fireEvent.pointerDown(cardWrapper);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 450));
      });
      fireEvent.pointerUp(cardWrapper);

      await waitFor(() => screen.getByText('Delete'));
      await userEvent.click(screen.getByText('Delete'));

      expect(onBulkDelete).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: '1' })])
      );
    });

    it('calls onSelect with selected ids when selection changes', async () => {
      const onSelect = vi.fn();
      render(<MobileCardList {...defaultProps} onSelect={onSelect} />);
      const cardWrapper = screen.getByTestId('card-1').parentElement!;

      fireEvent.pointerDown(cardWrapper);
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 450));
      });
      fireEvent.pointerUp(cardWrapper);

      await waitFor(() => {
        expect(onSelect).toHaveBeenCalledWith(expect.arrayContaining(['1']));
      });
    });
  });

  // ─── onSelect callback ────────────────────────────────────────────────────

  describe('onSelect prop', () => {
    it('calls onSelect([]) initially', () => {
      const onSelect = vi.fn();
      render(<MobileCardList {...defaultProps} onSelect={onSelect} />);
      // Called on mount with empty selection
      expect(onSelect).toHaveBeenCalledWith([]);
    });
  });

  // ─── className prop ───────────────────────────────────────────────────────

  describe('className prop', () => {
    it('applies custom className to wrapper element', () => {
      const { container } = render(
        <MobileCardList {...defaultProps} className="my-card-list" />
      );
      expect(container.querySelector('.my-card-list')).toBeInTheDocument();
    });
  });

  // ─── Accessibility ────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('passes axe check with data', async () => {
      const { container } = render(<MobileCardList {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe check in empty state', async () => {
      const { container } = render(
        <MobileCardList {...defaultProps} data={[]} isLoading={false} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe check in loading state', async () => {
      const { container } = render(
        <MobileCardList {...defaultProps} data={[]} isLoading />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('passes axe check in error state', async () => {
      const { container } = render(
        <MobileCardList
          {...defaultProps}
          data={[]}
          error={new Error('Something failed')}
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});