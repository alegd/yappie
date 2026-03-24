import { render, screen, waitFor } from "@testing-library/react";
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

vi.mock("@/components/ui/data-table", () => ({
  DataTable: ({
    data,
    columns,
    toolbar,
    loading,
    rowSelection,
    onRowSelectionChange,
    getRowId,
  }: any) => {
    const selection = rowSelection ?? {};
    const handleToggleAll = () => {
      const allSelected = (data ?? []).every((r: any) => {
        const id = getRowId ? getRowId(r) : r.id;
        return selection[id];
      });
      if (allSelected) {
        onRowSelectionChange?.({});
      } else {
        const next: Record<string, boolean> = {};
        (data ?? []).forEach((r: any) => {
          const id = getRowId ? getRowId(r) : r.id;
          next[id] = true;
        });
        onRowSelectionChange?.(next);
      }
    };
    const handleToggleRow = (row: any) => () => {
      const id = getRowId ? getRowId(row) : row.id;
      const next = { ...selection, [id]: !selection[id] };
      if (!next[id]) delete next[id];
      onRowSelectionChange?.(next);
    };
    const allSelected =
      (data ?? []).length > 0 &&
      (data ?? []).every((r: any) => {
        const id = getRowId ? getRowId(r) : r.id;
        return selection[id];
      });

    return (
      <div
        data-testid="data-table"
        data-rows={String(data?.length ?? 0)}
        data-loading={String(!!loading)}
      >
        {toolbar}
        <table>
          <tbody>
            {(data ?? []).map((row: any) => {
              const id = getRowId ? getRowId(row) : row.id;
              const isSelected = !!selection[id];
              return (
                <tr key={id}>
                  {columns.map((col: any) => (
                    <td key={col.id || col.accessorKey}>
                      {typeof col.cell === "function"
                        ? col.cell({
                            row: {
                              original: row,
                              getIsSelected: () => isSelected,
                              getToggleSelectedHandler: handleToggleRow(row),
                            },
                            table: {
                              getIsAllRowsSelected: () => allSelected,
                              getToggleAllRowsSelectedHandler: () => handleToggleAll,
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

const jiraConnected = { connected: true, siteName: "My Site" };
const jiraDisconnected = { connected: false, siteName: null };

function setupWithTickets(jira = jiraConnected) {
  let callIndex = 0;
  mockUseQuery.mockImplementation(() => {
    const idx = callIndex++;
    const position = idx % 3;
    if (position === 0) {
      return { data: mockTickets, error: undefined, isLoading: false, mutate: vi.fn() };
    }
    if (position === 1) {
      return { data: jira, error: undefined, isLoading: false, mutate: vi.fn() };
    }
    return {
      data: [{ id: "1", key: "YAP", name: "Yappie" }],
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    };
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
      const position = idx % 3;
      if (position === 0) {
        return {
          data: { data: [], total: 0, page: 1, limit: 50 },
          error: undefined,
          isLoading: false,
          mutate: vi.fn(),
        };
      }
      if (position === 1) {
        return { data: jiraConnected, error: undefined, isLoading: false, mutate: vi.fn() };
      }
      return { data: [], error: undefined, isLoading: false, mutate: vi.fn() };
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

  it("should show Approve button for DRAFT tickets", () => {
    setupWithTickets();
    render(<TicketList />);
    expect(screen.getByRole("button", { name: /approve fix bug/i })).toBeInTheDocument();
  });

  it("should show Export button for APPROVED tickets when Jira connected and project selected", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    render(<TicketList />);

    // Select a Jira project to make export buttons visible
    const select = screen.getByTestId("jira-project-select");
    await user.selectOptions(select, "YAP");

    expect(screen.getByRole("button", { name: /export add feature/i })).toBeInTheDocument();
  });

  it("should not show Export button when Jira disconnected", () => {
    setupWithTickets(jiraDisconnected);
    render(<TicketList />);
    expect(screen.queryByRole("button", { name: /export add feature/i })).not.toBeInTheDocument();
  });

  it("should call approve API when Approve clicked", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    mockApiFetcher.mockResolvedValue({});
    render(<TicketList />);

    await user.click(screen.getByRole("button", { name: /approve fix bug/i }));

    await waitFor(() => {
      expect(mockApiFetcher).toHaveBeenCalledWith("/v1/tickets/t-1/approve", { method: "POST" });
    });
    expect(mockInvalidateQuery).toHaveBeenCalled();
  });

  it("should call export API when Export clicked", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    mockApiFetcher.mockResolvedValue({});
    render(<TicketList />);

    // Select Jira project first
    const select = screen.getByTestId("jira-project-select");
    await user.selectOptions(select, "YAP");

    await user.click(screen.getByRole("button", { name: /export add feature/i }));

    await waitFor(() => {
      expect(mockApiFetcher).toHaveBeenCalledWith(
        "/v1/integrations/jira/export/t-2?projectKey=YAP",
        { method: "POST" },
      );
    });
  });

  it("should allow selecting tickets with checkboxes", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    render(<TicketList />);

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);
    expect(checkboxes[1]).toBeChecked();
  });

  it("should select all tickets and deselect all", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    render(<TicketList />);

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]); // select all

    expect(screen.getByText("3 selected")).toBeInTheDocument();

    await user.click(checkboxes[0]); // deselect all
    expect(screen.queryByText("3 selected")).not.toBeInTheDocument();
  });

  it("should show bulk approve button when DRAFT tickets selected", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    render(<TicketList />);

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]); // select DRAFT ticket

    expect(screen.getByText("Approve 1")).toBeInTheDocument();
  });

  it("should show bulk export button when APPROVED tickets selected and Jira connected with project", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    render(<TicketList />);

    // Select Jira project first
    const select = screen.getByTestId("jira-project-select");
    await user.selectOptions(select, "YAP");

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[2]); // select APPROVED ticket

    expect(screen.getByText("Export 1")).toBeInTheDocument();
  });

  it("should call bulk approve API when Approve N clicked", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    mockApiFetcher.mockResolvedValue({});
    render(<TicketList />);

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]); // select DRAFT ticket

    await user.click(screen.getByText("Approve 1"));

    await waitFor(() => {
      expect(mockApiFetcher).toHaveBeenCalledWith("/v1/tickets/t-1/approve", { method: "POST" });
    });
  });

  it("should call bulk export API when Export N clicked", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    mockApiFetcher.mockResolvedValue({});
    render(<TicketList />);

    // Select Jira project first
    const select = screen.getByTestId("jira-project-select");
    await user.selectOptions(select, "YAP");

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[2]); // select APPROVED ticket

    await user.click(screen.getByText("Export 1"));

    await waitFor(() => {
      expect(mockApiFetcher).toHaveBeenCalledWith("/v1/integrations/jira/export-bulk", {
        data: {
          ticketIds: ["t-2"],
          projectKey: "YAP",
        },
        method: "POST",
      });
    });
  });
});
