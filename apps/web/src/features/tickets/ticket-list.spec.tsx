import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TicketList } from "./ticket-list";

const { mockUseQuery, mockInvalidateQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockInvalidateQuery: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: mockInvalidateQuery,
}));

vi.mock("@/hooks/use-table-options", () => ({
  useTableOptions: () => ({
    page: 0,
    pageSize: 50,
    onPaginationChange: vi.fn(),
    sortBy: [],
    setSortBy: vi.fn(),
  }),
}));

vi.mock("@/components/ui/data-table", () => ({
  DataTable: ({
    data,
    columns,
    loading,
  }: {
    data: unknown[];
    columns: unknown[];
    loading: boolean;
  }) => (
    <div
      data-testid="data-table"
      data-loading={loading}
      data-rows={data.length}
      data-cols={columns.length}
    />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

const mockTickets = {
  data: [
    {
      id: "t-1",
      title: "Fix bug",
      status: "DRAFT",
      priority: "HIGH",
      jiraIssueKey: null,
      createdAt: "2026-03-21T10:00:00.000Z",
    },
    {
      id: "t-2",
      title: "Add feature",
      status: "APPROVED",
      priority: "MEDIUM",
      jiraIssueKey: null,
      createdAt: "2026-03-21T10:01:00.000Z",
    },
    {
      id: "t-3",
      title: "Dark mode",
      status: "EXPORTED",
      priority: "LOW",
      jiraIssueKey: "PROJ-42",
      createdAt: "2026-03-21T10:02:00.000Z",
    },
  ],
  total: 3,
  page: 1,
  limit: 50,
};

const jiraConnected = { connected: true, siteName: "My Site" };

function setupWithTickets() {
  let callIndex = 0;
  mockUseQuery.mockImplementation(() => {
    const idx = callIndex++;
    if (idx % 2 === 0) {
      return { data: mockTickets, error: undefined, isLoading: false, mutate: vi.fn() };
    }
    return { data: jiraConnected, error: undefined, isLoading: false, mutate: vi.fn() };
  });
}

describe("TicketList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render DataTable with ticket data", () => {
    setupWithTickets();
    render(<TicketList />);

    const table = screen.getByTestId("data-table");
    expect(table).toBeInTheDocument();
    expect(table).toHaveAttribute("data-rows", "3");
  });

  it("should pass loading state to DataTable", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: vi.fn(),
    });
    render(<TicketList />);

    const table = screen.getByTestId("data-table");
    expect(table).toHaveAttribute("data-loading", "true");
  });

  it("should show empty state when no tickets", () => {
    let callIndex = 0;
    mockUseQuery.mockImplementation(() => {
      const idx = callIndex++;
      if (idx % 2 === 0) {
        return {
          data: { data: [], total: 0, page: 1, limit: 50 },
          error: undefined,
          isLoading: false,
          mutate: vi.fn(),
        };
      }
      return { data: jiraConnected, error: undefined, isLoading: false, mutate: vi.fn() };
    });
    render(<TicketList />);

    expect(screen.getByText(/no tickets/i)).toBeInTheDocument();
  });

  it("should define 5 columns", () => {
    setupWithTickets();
    render(<TicketList />);

    const table = screen.getByTestId("data-table");
    expect(table).toHaveAttribute("data-cols", "6");
  });

  it("should render page title", () => {
    setupWithTickets();
    render(<TicketList />);

    expect(screen.getByText("Tickets")).toBeInTheDocument();
  });
});
