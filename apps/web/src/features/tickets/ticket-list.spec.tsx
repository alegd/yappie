import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TicketList } from "./ticket-list";

const { mockUseQuery, mockInvalidateQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockInvalidateQuery: vi.fn(),
}));

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: mockInvalidateQuery,
}));

vi.mock("@/lib/api", () => ({
  api: { post: mockPost },
}));

const mockTickets = {
  data: [
    {
      id: "t-1",
      title: "Fix Safari login bug",
      status: "DRAFT",
      priority: "HIGH",
      jiraIssueKey: null,
      jiraIssueUrl: null,
      createdAt: "2026-03-21T10:00:00.000Z",
    },
    {
      id: "t-2",
      title: "Update button design",
      status: "APPROVED",
      priority: "MEDIUM",
      jiraIssueKey: null,
      jiraIssueUrl: null,
      createdAt: "2026-03-21T10:01:00.000Z",
    },
    {
      id: "t-3",
      title: "Add dark mode",
      status: "EXPORTED",
      priority: "LOW",
      jiraIssueKey: "PROJ-42",
      jiraIssueUrl: "https://jira/42",
      createdAt: "2026-03-21T10:02:00.000Z",
    },
  ],
  total: 3,
  page: 1,
  limit: 50,
};

interface JiraMock {
  connected: boolean;
  siteName: string | null;
}
const jiraConnected: JiraMock = { connected: true, siteName: "My Site" };
const jiraDisconnected: JiraMock = { connected: false, siteName: null };

function setupWithTickets(jiraStatus = jiraConnected) {
  let callIndex = 0;
  mockUseQuery.mockImplementation(() => {
    const idx = callIndex++;
    if (idx % 2 === 0) {
      return { data: mockTickets, error: undefined, isLoading: false, mutate: vi.fn() };
    }
    return { data: jiraStatus, error: undefined, isLoading: false, mutate: vi.fn() };
  });
}

describe("TicketList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state initially", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: vi.fn(),
    });
    render(<TicketList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should display tickets after loading", () => {
    setupWithTickets();
    render(<TicketList />);

    expect(screen.getByText("Fix Safari login bug")).toBeInTheDocument();
    expect(screen.getByText("Update button design")).toBeInTheDocument();
    expect(screen.getByText("Add dark mode")).toBeInTheDocument();
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
      return { data: jiraDisconnected, error: undefined, isLoading: false, mutate: vi.fn() };
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

  it("should show Export button for APPROVED tickets when Jira connected", () => {
    setupWithTickets();
    render(<TicketList />);
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
    mockPost.mockResolvedValue({});
    render(<TicketList />);

    await user.click(screen.getByRole("button", { name: /approve fix safari/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/tickets/t-1/approve");
    });
    expect(mockInvalidateQuery).toHaveBeenCalled();
  });

  it("should call export API when Export clicked", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    mockPost.mockResolvedValue({});
    render(<TicketList />);

    await user.click(screen.getByRole("button", { name: /export update button/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/integrations/jira/export/t-2?projectKey=YAP");
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

  it("should show bulk export button when APPROVED tickets selected and Jira connected", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    render(<TicketList />);

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[2]); // select APPROVED ticket

    expect(screen.getByText("Export 1")).toBeInTheDocument();
  });

  it("should call bulk approve for all selected DRAFT tickets", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    mockPost.mockResolvedValue({});
    render(<TicketList />);

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]); // select DRAFT ticket

    await user.click(screen.getByText("Approve 1"));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/tickets/t-1/approve");
    });
  });

  it("should call bulk export for all selected APPROVED tickets", async () => {
    const user = userEvent.setup();
    setupWithTickets();
    mockPost.mockResolvedValue({});
    render(<TicketList />);

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[2]); // select APPROVED ticket

    await user.click(screen.getByText("Export 1"));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/integrations/jira/export-bulk", {
        ticketIds: ["t-2"],
        projectKey: "YAP",
      });
    });
  });
});
