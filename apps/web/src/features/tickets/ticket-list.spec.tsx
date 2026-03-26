import { act, render, screen, waitFor } from "@testing-library/react";
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

vi.mock("./components/actions-menu", () => ({
  ActionsMenu: ({ ticket }: { ticket: { id: string } }) => (
    <button data-testid={`actions-${ticket.id}`} aria-label="Actions" />
  ),
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// Capture onRowSelectionChange so tests can simulate selection via act()
let latestOnRowSelectionChange: ((s: Record<string, boolean>) => void) | null = null;

vi.mock("@/components/ui/data-table", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  DataTable: ({ data, columns, toolbar, loading, onRowSelectionChange, getRowId }: any) => {
    latestOnRowSelectionChange = onRowSelectionChange;
    return (
      <div
        data-testid="data-table"
        data-rows={String(data?.length ?? 0)}
        data-loading={String(!!loading)}
      >
        {toolbar}
        <table>
          <tbody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(data ?? []).map((row: any) => {
              const id = getRowId ? getRowId(row) : row.id;
              return (
                <tr key={id}>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {columns.map((col: any) => (
                    <td key={col.id || col.accessorKey}>
                      {typeof col.cell === "function"
                        ? col.cell({
                            row: {
                              original: row,
                              getIsSelected: () => false,
                              getToggleSelectedHandler: () => vi.fn(),
                            },
                            table: {
                              getIsAllRowsSelected: () => false,
                              getToggleAllRowsSelectedHandler: () => vi.fn(),
                            },
                          })
                        : null}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
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

interface JiraStatus {
  connected: boolean;
  siteName: string | null;
}

const jiraConnected: JiraStatus = { connected: true, siteName: "My Site" };
const jiraDisconnected: JiraStatus = { connected: false, siteName: null };

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

  it("should display priority and status badges", () => {
    setupWithTickets();
    render(<TicketList />);

    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
    expect(screen.getByText("EXPORTED")).toBeInTheDocument();
  });

  it("should show Jira key for exported tickets", () => {
    setupWithTickets();
    render(<TicketList />);
    expect(screen.getByText("PROJ-42")).toBeInTheDocument();
  });

  it("should render ticket title links", () => {
    setupWithTickets();
    render(<TicketList />);

    expect(screen.getByText("Fix bug")).toBeInTheDocument();
    expect(screen.getByText("Add feature")).toBeInTheDocument();
    expect(screen.getByText("Dark mode")).toBeInTheDocument();
  });

  it("should render actions menu for each ticket", () => {
    setupWithTickets();
    render(<TicketList />);

    expect(screen.getByTestId("actions-t-1")).toBeInTheDocument();
    expect(screen.getByTestId("actions-t-2")).toBeInTheDocument();
    expect(screen.getByTestId("actions-t-3")).toBeInTheDocument();
  });

  it("should render checkboxes for row selection", () => {
    setupWithTickets();
    render(<TicketList />);

    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThanOrEqual(3);
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

    act(() => {
      latestOnRowSelectionChange?.({ "t-1": true });
    });

    await user.click(screen.getByText("Approve 1"));

    await waitFor(() => {
      expect(mockApiFetcher).toHaveBeenCalledWith("/v1/tickets/t-1/approve", { method: "POST" });
    });
  });

  it("should call bulk export API", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    mockApiFetcher.mockResolvedValue({});
    render(<TicketList />);

    const select = screen.getByTestId("jira-project-select");
    await user.selectOptions(select, "YAP");

    act(() => {
      latestOnRowSelectionChange?.({ "t-2": true });
    });

    await user.click(screen.getByText("Export 1"));

    await waitFor(() => {
      expect(mockApiFetcher).toHaveBeenCalledWith("/v1/integrations/jira/export-bulk", {
        data: { ticketIds: ["t-2"], projectKey: "YAP" },
        method: "POST",
      });
    });
  });

  it("should show delete button in bulk actions", () => {
    setupWithTickets();
    render(<TicketList />);

    act(() => {
      latestOnRowSelectionChange?.({ "t-1": true });
    });

    expect(screen.getByText("Delete")).toBeInTheDocument();
  });
});
