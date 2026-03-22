import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketList } from "./ticket-list";

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: vi.fn(),
}));

const mockTickets = {
  data: [
    {
      id: "t-1",
      title: "Fix Safari login bug",
      status: "DRAFT",
      priority: "HIGH",
      jiraIssueKey: null,
      createdAt: "2026-03-21T10:00:00.000Z",
    },
    {
      id: "t-2",
      title: "Update button design",
      status: "APPROVED",
      priority: "MEDIUM",
      jiraIssueKey: null,
      createdAt: "2026-03-21T10:01:00.000Z",
    },
    {
      id: "t-3",
      title: "Add dark mode",
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

  it("should display tickets after loading", async () => {
    mockUseQuery.mockReturnValue({
      data: mockTickets,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
    render(<TicketList />);

    expect(await screen.findByText("Fix Safari login bug")).toBeInTheDocument();
    expect(screen.getByText("Update button design")).toBeInTheDocument();
    expect(screen.getByText("Add dark mode")).toBeInTheDocument();
  });

  it("should show empty state when no tickets", async () => {
    mockUseQuery.mockReturnValue({
      data: { data: [], total: 0, page: 1, limit: 50 },
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
    render(<TicketList />);
    expect(await screen.findByText(/no tickets/i)).toBeInTheDocument();
  });

  it("should display priority and status badges", async () => {
    mockUseQuery.mockReturnValue({
      data: mockTickets,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
    render(<TicketList />);

    expect(await screen.findByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
    expect(screen.getByText("EXPORTED")).toBeInTheDocument();
  });

  it("should show Jira key for exported tickets", async () => {
    mockUseQuery.mockReturnValue({
      data: mockTickets,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
    render(<TicketList />);
    expect(await screen.findByText("PROJ-42")).toBeInTheDocument();
  });

  it("should allow selecting tickets with checkboxes", async () => {
    const user = userEvent.setup();
    mockUseQuery.mockReturnValue({
      data: mockTickets,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
    render(<TicketList />);

    await screen.findByText("Fix Safari login bug");
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[1]);
    expect(checkboxes[1]).toBeChecked();
  });
});
