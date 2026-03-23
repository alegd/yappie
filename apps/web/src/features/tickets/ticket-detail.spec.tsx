import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketDetail } from "./ticket-detail";

const { mockUseQuery, mockInvalidateQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockInvalidateQuery: vi.fn(),
}));

const { mockPost, mockPatch } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockPatch: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: mockInvalidateQuery,
}));

vi.mock("@/lib/api", () => ({
  api: { post: mockPost, patch: mockPatch },
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

const mockTicket = {
  id: "t-1",
  title: "Fix Safari login bug",
  description:
    "The login form does not work on Safari 17. Users see a blank screen after submitting.",
  status: "DRAFT" as const,
  priority: "HIGH" as const,
  jiraIssueKey: null,
  jiraIssueUrl: null,
  audioRecordingId: "a-1",
  projectId: null,
  createdAt: "2026-03-21T10:00:00.000Z",
  updatedAt: "2026-03-21T10:01:00.000Z",
};

const jiraConnected = { connected: true };

function setupMocks(ticket = mockTicket, jira = jiraConnected) {
  let callIndex = 0;
  mockUseQuery.mockImplementation(() => {
    const idx = callIndex++;
    if (idx % 2 === 0) {
      return { data: ticket, error: undefined, isLoading: false, mutate: vi.fn() };
    }
    return { data: jira, error: undefined, isLoading: false, mutate: vi.fn() };
  });
}

describe("TicketDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: vi.fn(),
    });
    render(<TicketDetail ticketId="t-1" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should show error state when ticket not found", () => {
    let callIndex = 0;
    mockUseQuery.mockImplementation(() => {
      const idx = callIndex++;
      if (idx % 2 === 0) {
        return {
          data: undefined,
          error: new Error("Not found"),
          isLoading: false,
          mutate: vi.fn(),
        };
      }
      return { data: jiraConnected, error: undefined, isLoading: false, mutate: vi.fn() };
    });
    render(<TicketDetail ticketId="t-1" />);
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });

  it("should display ticket title and description", () => {
    setupMocks();
    render(<TicketDetail ticketId="t-1" />);

    expect(screen.getByText("Fix Safari login bug")).toBeInTheDocument();
    expect(screen.getByText(/blank screen after submitting/)).toBeInTheDocument();
  });

  it("should display status and priority badges", () => {
    setupMocks();
    render(<TicketDetail ticketId="t-1" />);

    expect(screen.getByText("DRAFT")).toBeInTheDocument();
    expect(screen.getByText("HIGH")).toBeInTheDocument();
  });

  it("should show Approve button for DRAFT tickets", () => {
    setupMocks();
    render(<TicketDetail ticketId="t-1" />);

    expect(screen.getByRole("button", { name: /approve/i })).toBeInTheDocument();
  });

  it("should show Edit button for DRAFT tickets", () => {
    setupMocks();
    render(<TicketDetail ticketId="t-1" />);

    expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
  });

  it("should show Export button for APPROVED tickets when Jira connected", () => {
    setupMocks({ ...mockTicket, status: "APPROVED" });
    render(<TicketDetail ticketId="t-1" />);

    expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument();
  });

  it("should call approve API when Approve clicked", async () => {
    const user = userEvent.setup();
    setupMocks();
    mockPost.mockResolvedValue({});
    render(<TicketDetail ticketId="t-1" />);

    await user.click(screen.getByRole("button", { name: /approve/i }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/tickets/t-1/approve");
    });
  });

  it("should enter edit mode and save changes", async () => {
    const user = userEvent.setup();
    setupMocks();
    mockPatch.mockResolvedValue({});
    render(<TicketDetail ticketId="t-1" />);

    await user.click(screen.getByRole("button", { name: /edit/i }));

    const titleInput = screen.getByDisplayValue("Fix Safari login bug");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated title");

    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith(
        "/tickets/t-1",
        expect.objectContaining({ title: "Updated title" }),
      );
    });
  });

  it("should cancel editing without saving", async () => {
    const user = userEvent.setup();
    setupMocks();
    render(<TicketDetail ticketId="t-1" />);

    await user.click(screen.getByRole("button", { name: /edit/i }));
    expect(screen.getByDisplayValue("Fix Safari login bug")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByDisplayValue("Fix Safari login bug")).not.toBeInTheDocument();
    expect(screen.getByText("Fix Safari login bug")).toBeInTheDocument();
  });

  it("should show back link to tickets page", () => {
    setupMocks();
    render(<TicketDetail ticketId="t-1" />);

    const backLink = screen.getAllByRole("link")[0];
    expect(backLink).toHaveAttribute("href", "/dashboard/tickets");
  });

  it("should display metadata", () => {
    setupMocks();
    render(<TicketDetail ticketId="t-1" />);

    expect(screen.getByText("Created")).toBeInTheDocument();
    expect(screen.getByText("Last updated")).toBeInTheDocument();
  });

  it("should show Jira key in metadata for exported tickets", () => {
    setupMocks({ ...mockTicket, status: "EXPORTED", jiraIssueKey: "YAP-42" });
    render(<TicketDetail ticketId="t-1" />);

    expect(screen.getByText("YAP-42")).toBeInTheDocument();
  });
});
