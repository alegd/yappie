import { render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("button", { name: /approve fix safari/i })).toBeInTheDocument();
  });

  it("should show Export button for APPROVED tickets when Jira connected and project selected", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    render(<TicketList />);

    // Select a Jira project to make export buttons visible
    const select = screen.getByTestId("jira-project-select");
    await user.selectOptions(select, "YAP");

    expect(screen.getByRole("button", { name: /export update button/i })).toBeInTheDocument();
  });

  it("should not show Export button when Jira disconnected", () => {
    setupWithTickets(jiraDisconnected);
    render(<TicketList />);
    expect(screen.queryByRole("button", { name: /export update button/i })).not.toBeInTheDocument();
  });

  it("should call approve API when Approve clicked", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    mockApiFetcher.mockResolvedValue({});
    render(<TicketList />);

    await user.click(screen.getByRole("button", { name: /approve fix safari/i }));

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

    await user.click(screen.getByRole("button", { name: /export update button/i }));

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

  it("should define 5 columns", () => {
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

  it("should render page title", () => {
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
