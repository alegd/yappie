import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TicketList } from "./ticket-list";

const { mockUseQuery, mockInvalidateQuery, mockApiFetcher } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockInvalidateQuery: vi.fn(),
  mockApiFetcher: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: mockInvalidateQuery,
}));

vi.mock("@/lib/api-fetcher", () => ({
  apiFetcher: mockApiFetcher,
}));

vi.mock("./components/jira-project-select", () => ({
  JiraProjectSelect: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <select
      data-testid="jira-project-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Jira project"
    >
      <option value="">Select project</option>
      <option value="YAP">YAP</option>
    </select>
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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

// Store the latest onRowSelectionChange so tests can call it externally
let latestOnRowSelectionChange: ((s: Record<string, boolean>) => void) | null = null;

vi.mock("@/components/ui/data-table", () => ({
  DataTable: ({ data, toolbar, loading, _rowSelection, onRowSelectionChange, getRowId }: any) => {
    latestOnRowSelectionChange = onRowSelectionChange;
    return (
      <div
        data-testid="data-table"
        data-rows={String(data?.length ?? 0)}
        data-loading={String(!!loading)}
      >
        {toolbar}
        <ul>
          {(data ?? []).map((row: any) => {
            const id = getRowId ? getRowId(row) : row.id;
            return (
              <li key={id} data-testid={`row-${id}`}>
                {row.title} — {row.status} — {row.priority}
                {row.jiraIssueKey ? ` — ${row.jiraIssueKey}` : ""}
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
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
const jiraDisconnected = { connected: false, siteName: null };
const stableMutate = vi.fn();

function setupWithTickets(jira = jiraConnected) {
  let callIndex = 0;
  mockUseQuery.mockImplementation(() => {
    const position = callIndex++ % 2;
    if (position === 0) {
      return { data: mockTickets, error: undefined, isLoading: false, mutate: stableMutate };
    }
    return { data: jira, error: undefined, isLoading: false, mutate: stableMutate };
  });
}

describe("TicketList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    latestOnRowSelectionChange = null;
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
      mutate: stableMutate,
    });
    render(<TicketList />);

    expect(screen.getByTestId("data-table")).toHaveAttribute("data-loading", "true");
  });

  it("should show empty state when no tickets", () => {
    let callIndex = 0;
    mockUseQuery.mockImplementation(() => {
      const position = callIndex++ % 2;
      if (position === 0) {
        return {
          data: { data: [], total: 0, page: 1, limit: 50 },
          error: undefined,
          isLoading: false,
          mutate: stableMutate,
        };
      }
      return { data: jiraConnected, error: undefined, isLoading: false, mutate: stableMutate };
    });
    render(<TicketList />);
    expect(screen.getByText(/no tickets/i)).toBeInTheDocument();
  });

  it("should render ticket rows", () => {
    setupWithTickets();
    render(<TicketList />);

    expect(screen.getByText(/Fix bug/)).toBeInTheDocument();
    expect(screen.getByText(/Add feature/)).toBeInTheDocument();
    expect(screen.getByText(/Dark mode/)).toBeInTheDocument();
  });

  it("should show Jira key for exported tickets", () => {
    setupWithTickets();
    render(<TicketList />);

    expect(screen.getByText(/PROJ-42/)).toBeInTheDocument();
  });

  it("should show Jira project select when connected", () => {
    setupWithTickets();
    render(<TicketList />);

    expect(screen.getByTestId("jira-project-select")).toBeInTheDocument();
  });

  it("should not show Jira project select when disconnected", () => {
    setupWithTickets(jiraDisconnected);
    render(<TicketList />);

    expect(screen.queryByTestId("jira-project-select")).not.toBeInTheDocument();
  });

  it("should show bulk actions when tickets are selected", () => {
    setupWithTickets();
    render(<TicketList />);

    // Simulate selecting a DRAFT ticket via the captured callback
    act(() => {
      latestOnRowSelectionChange?.({ "t-1": true });
    });

    expect(screen.getByText("1 selected")).toBeInTheDocument();
    expect(screen.getByText("Approve 1")).toBeInTheDocument();
  });

  it("should show bulk export when APPROVED ticket selected and Jira project chosen", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    render(<TicketList />);

    const select = screen.getByTestId("jira-project-select");
    await user.selectOptions(select, "YAP");

    // Simulate selecting an APPROVED ticket
    act(() => {
      latestOnRowSelectionChange?.({ "t-2": true });
    });

    expect(screen.getByText("Export 1")).toBeInTheDocument();
  });

  it("should call bulk approve API", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    mockApiFetcher.mockResolvedValue({});
    render(<TicketList />);

    // Select DRAFT ticket
    act(() => {
      latestOnRowSelectionChange?.({ "t-1": true });
    });

    await user.click(screen.getByText("Approve 1"));

    expect(mockApiFetcher).toHaveBeenCalledWith("/v1/tickets/t-1/approve", { method: "POST" });
  });

  it("should call bulk export API", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    mockApiFetcher.mockResolvedValue({});
    render(<TicketList />);

    const select = screen.getByTestId("jira-project-select");
    await user.selectOptions(select, "YAP");

    // Select APPROVED ticket
    act(() => {
      latestOnRowSelectionChange?.({ "t-2": true });
    });

    await user.click(screen.getByText("Export 1"));

    expect(mockApiFetcher).toHaveBeenCalledWith("/v1/integrations/jira/export-bulk", {
      data: { ticketIds: ["t-2"], projectKey: "YAP" },
      method: "POST",
    });
  });
});
