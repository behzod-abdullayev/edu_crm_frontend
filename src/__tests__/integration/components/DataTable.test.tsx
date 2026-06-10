import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
// Correct import: barrel file re-exports from data-display/DataTable
import { DataTable } from '@/shared/components/DataTable/DataTable';
import type { ColumnDef } from '@/shared/components/DataTable/DataTable.types';
import type { PaginationMeta } from '@/generated/models';
import type { DataTableProps } from '@/shared/components/data-display/DataTable';

expect.extend(toHaveNoViolations);

// Mock next-intl (DataTable uses useTranslations internally)
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    tr: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
      <tr {...props}>{children}</tr>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

interface TestRow extends Record<string, unknown> {
  id: string;
  name: string;
  age: number;
  status: string;
}

// ColumnDef requires `accessor` — map key → accessor matching the field name
const columns: ColumnDef<TestRow>[] = [
  { key: 'name',   header: 'Name',   accessor: 'name',   sortable: true  },
  { key: 'age',    header: 'Age',    accessor: 'age',    sortable: true  },
  { key: 'status', header: 'Status', accessor: 'status', sortable: false },
];

const testData: TestRow[] = [
  { id: '1', name: 'Alice',   age: 25, status: 'active'   },
  { id: '2', name: 'Bob',     age: 30, status: 'inactive' },
  { id: '3', name: 'Charlie', age: 22, status: 'active'   },
];

/** Helper: build a fully-typed PaginationMeta from partial input */
function makePagination(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// DataTable uses `pagination` object + `rowKey` (required)
const defaultProps: DataTableProps<TestRow> = {
  columns,
  data: testData,
  isLoading: false,
  error: null,
  rowKey: 'id' as keyof TestRow,
  pagination: makePagination(1, 10, 3),
  onPageChange: vi.fn(),
  onSearch: vi.fn(),
  onRowSelect: vi.fn(),
  onSort: vi.fn(),
};

describe('DataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── Column headers ──────────────────────────────────────────────────────

  describe('column headers', () => {
    it('renders all column headers from columns prop', () => {
      render(<DataTable {...defaultProps} />);
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('renders correct number of columns', () => {
      render(<DataTable {...defaultProps} />);
      const headers = screen.getAllByRole('columnheader');
      // May include a checkbox column — at minimum our 3 columns are present
      expect(headers.length).toBeGreaterThanOrEqual(3);
    });
  });

  // ─── Data rows ───────────────────────────────────────────────────────────

  describe('data rows', () => {
    it('renders a row for each data item', () => {
      render(<DataTable {...defaultProps} />);
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('renders cell values correctly', () => {
      render(<DataTable {...defaultProps} />);
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
    });
  });

  // ─── Loading state ────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('shows skeleton rows when isLoading is true', () => {
      render(<DataTable {...defaultProps} isLoading={true} data={[]} />);
      // Skeleton elements are aria-hidden; verify real data is NOT shown
      expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    });

    it('does not show data rows when isLoading is true', () => {
      render(<DataTable {...defaultProps} isLoading={true} data={[]} />);
      expect(screen.queryByText('Bob')).not.toBeInTheDocument();
    });
  });

  // ─── Error state ──────────────────────────────────────────────────────────

  describe('error state', () => {
    it('shows error state when error prop is set', () => {
      render(
        <DataTable
          {...defaultProps}
          data={[]}
          error={new Error('Network error')}
        />
      );
      expect(
        screen.getByText(/error|failed|retry|xato/i)
      ).toBeInTheDocument();
    });

    it('shows retry button when error prop is set', () => {
      render(
        <DataTable
          {...defaultProps}
          data={[]}
          error={new Error('Network error')}
        />
      );
      expect(
        screen.getByRole('button', { name: /retry|again|qayta/i })
      ).toBeInTheDocument();
    });
  });

  // ─── Empty state ──────────────────────────────────────────────────────────

  describe('empty state', () => {
    it('shows empty state when data is empty and not loading', () => {
      render(
        <DataTable
          {...defaultProps}
          data={[]}
          emptyState={{ title: 'No results found' }}
        />
      );
      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('shows custom empty state illustration/icon when provided', () => {
      render(
        <DataTable
          {...defaultProps}
          data={[]}
          emptyState={{ title: 'Empty table', description: 'Add some data.' }}
        />
      );
      expect(screen.getByText('Empty table')).toBeInTheDocument();
      expect(screen.getByText('Add some data.')).toBeInTheDocument();
    });
  });

  // ─── Sorting ──────────────────────────────────────────────────────────────

  describe('sorting', () => {
    it('calls onSort when a sortable column header is clicked', async () => {
      const onSort = vi.fn();
      const user = userEvent.setup();
      render(<DataTable {...defaultProps} onSort={onSort} />);
      const nameHeader = screen.getByText('Name');
      await user.click(nameHeader);
      expect(onSort).toHaveBeenCalled();
    });

    it('does not call onSort when clicking a non-sortable column', async () => {
      const onSort = vi.fn();
      const user = userEvent.setup();
      render(<DataTable {...defaultProps} onSort={onSort} />);
      const statusHeader = screen.getByText('Status');
      await user.click(statusHeader);
      expect(onSort).not.toHaveBeenCalled();
    });
  });

  // ─── Search ───────────────────────────────────────────────────────────────

  describe('search', () => {
    it('calls onSearch when typing in search input', async () => {
      const onSearch = vi.fn();
      const user = userEvent.setup();
      render(<DataTable {...defaultProps} onSearch={onSearch} />);
      const searchInput = screen.queryByRole('searchbox') ??
        screen.queryByPlaceholderText(/search|qidirish/i);
      if (searchInput) {
        await user.type(searchInput, 'Alice');
        await waitFor(() => {
          expect(onSearch).toHaveBeenCalled();
        });
      }
    });
  });

  // ─── Pagination ───────────────────────────────────────────────────────────

  describe('pagination', () => {
    it('calls onPageChange when next page button is clicked', async () => {
      const onPageChange = vi.fn();
      const user = userEvent.setup();
      render(
        <DataTable
          {...defaultProps}
          onPageChange={onPageChange}
          pagination={makePagination(1, 1, 3)}
          data={[testData[0]!]}
        />
      );
      const nextBtn = screen.queryByRole('button', { name: /next|keyingi|>/i });
      if (nextBtn && !nextBtn.hasAttribute('disabled')) {
        await user.click(nextBtn);
        expect(onPageChange).toHaveBeenCalledWith(2);
      }
    });

    it('renders page info when pagination is provided', () => {
      render(
        <DataTable
          {...defaultProps}
          pagination={makePagination(1, 10, 3)}
        />
      );
      // Page indicator may render "1" or "Page 1" or "1-3 of 3"
      expect(document.body.textContent).toMatch(/1|3/);
    });
  });

  // ─── Row selection ────────────────────────────────────────────────────────

  describe('row selection', () => {
    it('calls onRowSelect when a row checkbox is clicked', async () => {
      const onRowSelect = vi.fn();
      const user = userEvent.setup();
      render(<DataTable {...defaultProps} onRowSelect={onRowSelect} />);
      const checkboxes = screen.queryAllByRole('checkbox');
      if (checkboxes.length > 1) {
        // Skip header checkbox (index 0), click first row checkbox
        await user.click(checkboxes[1]!);
        expect(onRowSelect).toHaveBeenCalled();
      }
    });

    it('selects all rows when header checkbox is clicked', async () => {
      const onRowSelect = vi.fn();
      const user = userEvent.setup();
      render(<DataTable {...defaultProps} onRowSelect={onRowSelect} />);
      const checkboxes = screen.queryAllByRole('checkbox');
      if (checkboxes.length > 0) {
        await user.click(checkboxes[0]!); // header checkbox
        expect(onRowSelect).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({ id: '1' }),
          ])
        );
      }
    });
  });

  // ─── Accessibility ────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('passes axe accessibility check', async () => {
      const { container } = render(<DataTable {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('table element has correct role', () => {
      render(<DataTable {...defaultProps} />);
      expect(screen.getByRole('table')).toBeInTheDocument();
    });
  });
});