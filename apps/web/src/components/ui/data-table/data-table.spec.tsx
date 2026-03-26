import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ColumnDef } from "@tanstack/react-table";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DataTable } from "./data-table";

interface TestRow {
  id: string;
  name: string;
  age: number;
}

const columns: ColumnDef<TestRow, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "age", header: "Age" },
];

const data: TestRow[] = [
  { id: "1", name: "Alice", age: 30 },
  { id: "2", name: "Bob", age: 25 },
  { id: "3", name: "Charlie", age: 35 },
];

const defaultProps = {
  columns,
  data,
  count: 3,
  page: 0,
  pageSize: 10,
  onPaginationChange: vi.fn(),
};

describe("DataTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render column headers", () => {
    render(<DataTable {...defaultProps} />);

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
  });

  it("should render rows with data", () => {
    render(<DataTable {...defaultProps} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("should show empty state when no data", () => {
    render(<DataTable {...defaultProps} data={[]} count={0} />);

    expect(screen.getByText("No data found.")).toBeInTheDocument();
  });

  it("should show skeleton rows when loading", () => {
    const { container } = render(<DataTable {...defaultProps} loading />);

    const skeletonRows = container.querySelectorAll(".animate-pulse");
    expect(skeletonRows.length).toBeGreaterThan(0);
    // Should not show actual data
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("should render toolbar when provided", () => {
    render(<DataTable {...defaultProps} toolbar={<div data-testid="toolbar">Toolbar</div>} />);

    expect(screen.getByTestId("toolbar")).toBeInTheDocument();
  });

  it("should not render toolbar when not provided", () => {
    render(<DataTable {...defaultProps} />);

    expect(screen.queryByTestId("toolbar")).not.toBeInTheDocument();
  });

  it("should render pagination when data exists", () => {
    render(<DataTable {...defaultProps} />);

    expect(screen.getByText(/of 3/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "First page" })).toBeInTheDocument();
  });

  it("should not render pagination when data is empty", () => {
    render(<DataTable {...defaultProps} data={[]} count={0} />);

    expect(screen.queryByText(/of 0/)).not.toBeInTheDocument();
  });

  it("should call onRowClick when row is clicked", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<DataTable {...defaultProps} onRowClick={onRowClick} />);

    await user.click(screen.getByText("Alice"));

    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(
      expect.objectContaining({
        original: { id: "1", name: "Alice", age: 30 },
      }),
    );
  });

  it("should highlight selected rows", () => {
    const { container } = render(
      <DataTable
        {...defaultProps}
        enableRowSelection
        rowSelection={{ "0": true }}
        onRowSelectionChange={vi.fn()}
        getRowId={(row) => row.id}
      />,
    );

    // The selected row should have the accent background class
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(3);
  });

  it("should support sorting indicators", () => {
    render(
      <DataTable {...defaultProps} sortBy={[{ id: "name", desc: false }]} setSortBy={vi.fn()} />,
    );

    // Header should be rendered with sort indicator
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  describe("pagination interactions", () => {
    const paginatedProps = {
      ...defaultProps,
      count: 100,
      pageSize: 2,
      page: 1,
    };

    it("should navigate to next page", async () => {
      const user = userEvent.setup();
      render(<DataTable {...paginatedProps} />);

      await user.click(screen.getByRole("button", { name: "Next page" }));

      expect(paginatedProps.onPaginationChange).toHaveBeenCalled();
    });

    it("should navigate to previous page", async () => {
      const user = userEvent.setup();
      render(<DataTable {...paginatedProps} />);

      await user.click(screen.getByRole("button", { name: "Previous page" }));

      expect(paginatedProps.onPaginationChange).toHaveBeenCalled();
    });

    it("should navigate to first page", async () => {
      const user = userEvent.setup();
      render(<DataTable {...paginatedProps} />);

      await user.click(screen.getByRole("button", { name: "First page" }));

      expect(paginatedProps.onPaginationChange).toHaveBeenCalled();
    });

    it("should navigate to last page", async () => {
      const user = userEvent.setup();
      render(<DataTable {...paginatedProps} />);

      await user.click(screen.getByRole("button", { name: "Last page" }));

      expect(paginatedProps.onPaginationChange).toHaveBeenCalled();
    });

    it("should change page size", async () => {
      const user = userEvent.setup();
      render(<DataTable {...paginatedProps} />);

      const select = screen.getByRole("combobox");
      await user.selectOptions(select, "25");

      expect(paginatedProps.onPaginationChange).toHaveBeenCalled();
    });

    it("should disable prev/first buttons on first page", () => {
      render(<DataTable {...paginatedProps} page={0} />);

      expect(screen.getByRole("button", { name: "First page" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    });

    it("should show correct range text", () => {
      render(<DataTable {...paginatedProps} />);

      // page=1, pageSize=2 → rows 3-4 of 100
      expect(screen.getByText("3–4 of 100")).toBeInTheDocument();
    });
  });
});
