import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TicketDetailDrawer } from "./ticket-detail-drawer";

const { mockUseQuery, mockApiFetcher, mockInvalidateQuery, mockToastError, mockToastSuccess } =
  vi.hoisted(() => ({
    mockUseQuery: vi.fn(),
    mockApiFetcher: vi.fn(),
    mockInvalidateQuery: vi.fn(),
    mockToastError: vi.fn(),
    mockToastSuccess: vi.fn(),
  }));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: mockInvalidateQuery,
}));

vi.mock("@/lib/api-fetcher", () => ({
  apiFetcher: mockApiFetcher,
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  toast: {
    error: mockToastError,
    success: mockToastSuccess,
    info: vi.fn(),
  },
}));

vi.mock("next/link", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const baseTicket = {
  id: "t-1",
  title: "Fix login",
  description: "Login is broken",
  status: "DRAFT" as const,
  priority: "HIGH" as const,
  jiraIssueKey: null,
  jiraIssueUrl: null,
  audioRecordingId: "a-1",
  projectId: "p-1",
  createdAt: "2026-06-11T10:00:00Z",
  updatedAt: "2026-06-11T10:00:00Z",
  sourceTranscript: "...the login is broken when you click submit...",
  audioRecording: { id: "a-1", fileName: "sprint.webm" },
};

describe("TicketDetailDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when ticketId is null", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    const { container } = render(
      <TicketDetailDrawer ticketId={null} audioId="a-1" jiraConnected={true} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows a loading state while the ticket loads", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
      mutate: vi.fn(),
    });
    render(
      <TicketDetailDrawer ticketId="t-1" audioId="a-1" jiraConnected={true} onClose={vi.fn()} />,
    );
    expect(screen.getByLabelText(/loading ticket/i)).toBeInTheDocument();
  });

  it("renders title, badges, description, and source audio when loaded", () => {
    mockUseQuery.mockReturnValue({
      data: baseTicket,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(
      <TicketDetailDrawer ticketId="t-1" audioId="a-1" jiraConnected={true} onClose={vi.fn()} />,
    );
    expect(screen.getByText("Fix login")).toBeInTheDocument();
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
    expect(screen.getByText("Login is broken")).toBeInTheDocument();
    expect(screen.getByText("sprint.webm")).toBeInTheDocument();
    expect(screen.getByText(/the login is broken/i)).toBeInTheDocument();
  });

  it("renders a placeholder when sourceTranscript is null", () => {
    mockUseQuery.mockReturnValue({
      data: { ...baseTicket, sourceTranscript: null },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(
      <TicketDetailDrawer ticketId="t-1" audioId="a-1" jiraConnected={true} onClose={vi.fn()} />,
    );
    expect(screen.getByText(/source quote not available/i)).toBeInTheDocument();
  });

  it("clicking the close button calls onClose", async () => {
    const onClose = vi.fn();
    const u = userEvent.setup();
    mockUseQuery.mockReturnValue({
      data: baseTicket,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(
      <TicketDetailDrawer ticketId="t-1" audioId="a-1" jiraConnected={true} onClose={onClose} />,
    );
    await u.click(screen.getByLabelText(/close drawer/i));
    expect(onClose).toHaveBeenCalled();
  });

  it("clicking Edit switches to inputs and shows Save + Cancel", async () => {
    const u = userEvent.setup();
    mockUseQuery.mockReturnValue({
      data: baseTicket,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(
      <TicketDetailDrawer ticketId="t-1" audioId="a-1" jiraConnected={true} onClose={vi.fn()} />,
    );
    await u.click(screen.getByRole("button", { name: /^edit$/i }));
    expect(screen.getByDisplayValue("Fix login")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("Save calls PATCH and exits edit mode", async () => {
    const u = userEvent.setup();
    mockUseQuery.mockReturnValue({
      data: baseTicket,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    mockApiFetcher.mockResolvedValue({});
    render(
      <TicketDetailDrawer ticketId="t-1" audioId="a-1" jiraConnected={true} onClose={vi.fn()} />,
    );
    await u.click(screen.getByRole("button", { name: /^edit$/i }));
    const title = screen.getByDisplayValue("Fix login") as HTMLInputElement;
    await u.clear(title);
    await u.type(title, "New title");
    await u.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(mockApiFetcher).toHaveBeenCalledWith(
        "/v1/tickets/t-1",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
    expect(mockInvalidateQuery).toHaveBeenCalledWith("/v1/audio/a-1");
  });

  it("Cancel restores original values and exits edit mode", async () => {
    const u = userEvent.setup();
    mockUseQuery.mockReturnValue({
      data: baseTicket,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(
      <TicketDetailDrawer ticketId="t-1" audioId="a-1" jiraConnected={true} onClose={vi.fn()} />,
    );
    await u.click(screen.getByRole("button", { name: /^edit$/i }));
    const title = screen.getByDisplayValue("Fix login") as HTMLInputElement;
    await u.clear(title);
    await u.type(title, "x");
    await u.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.getByText("Fix login")).toBeInTheDocument();
    expect(screen.queryByDisplayValue("x")).not.toBeInTheDocument();
  });

  it("Delete with confirm calls DELETE + onClose", async () => {
    const u = userEvent.setup();
    const onClose = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockUseQuery.mockReturnValue({
      data: baseTicket,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    mockApiFetcher.mockResolvedValue({});
    render(
      <TicketDetailDrawer ticketId="t-1" audioId="a-1" jiraConnected={true} onClose={onClose} />,
    );
    await u.click(screen.getByRole("button", { name: /delete/i }));
    await waitFor(() => {
      expect(mockApiFetcher).toHaveBeenCalledWith(
        "/v1/tickets/t-1",
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("Delete cancelled in confirm does NOT call DELETE", async () => {
    const u = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(false);
    mockUseQuery.mockReturnValue({
      data: baseTicket,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(
      <TicketDetailDrawer ticketId="t-1" audioId="a-1" jiraConnected={true} onClose={vi.fn()} />,
    );
    await u.click(screen.getByRole("button", { name: /delete/i }));
    expect(mockApiFetcher).not.toHaveBeenCalled();
  });

  it("shows Export button when APPROVED + Jira connected + not exported", async () => {
    const u = userEvent.setup();
    mockUseQuery.mockReturnValue({
      data: { ...baseTicket, status: "APPROVED" as const },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    mockApiFetcher.mockResolvedValue({});
    render(
      <TicketDetailDrawer ticketId="t-1" audioId="a-1" jiraConnected={true} onClose={vi.fn()} />,
    );
    await u.click(screen.getByRole("button", { name: /export/i }));
    await waitFor(() => {
      expect(mockApiFetcher).toHaveBeenCalledWith(
        "/v1/integrations/jira/export/t-1",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("shows exported Jira link when ticket is already exported", () => {
    mockUseQuery.mockReturnValue({
      data: {
        ...baseTicket,
        status: "EXPORTED" as const,
        jiraIssueKey: "PROJ-42",
        jiraIssueUrl: "https://x.atlassian.net/browse/PROJ-42",
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(
      <TicketDetailDrawer ticketId="t-1" audioId="a-1" jiraConnected={true} onClose={vi.fn()} />,
    );
    const link = screen.getByText("PROJ-42").closest("a");
    expect(link).toHaveAttribute("href", "https://x.atlassian.net/browse/PROJ-42");
  });
});
