import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BulkActionBar } from "./bulk-action-bar";
import type { Ticket } from "@/features/tickets/types";

const { mockApiFetcher, mockInvalidateQuery, mockToastError } = vi.hoisted(() => ({
  mockApiFetcher: vi.fn(),
  mockInvalidateQuery: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("@/lib/api-fetcher", () => ({
  apiFetcher: mockApiFetcher,
}));

vi.mock("@/hooks/use-query", () => ({
  invalidateQuery: mockInvalidateQuery,
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  toast: {
    error: mockToastError,
    success: vi.fn(),
    info: vi.fn(),
  },
}));

const baseTicket: Ticket = {
  id: "t-1",
  title: "x",
  description: "",
  status: "DRAFT",
  priority: "LOW",
  jiraIssueKey: null,
  jiraIssueUrl: null,
  audioRecordingId: "a-1",
  projectId: "p-1",
  createdAt: "",
  updatedAt: "",
};

function draft(id: string): Ticket {
  return { ...baseTicket, id, status: "DRAFT" };
}
function approved(id: string): Ticket {
  return { ...baseTicket, id, status: "APPROVED" };
}

describe("BulkActionBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when no tickets are selected", () => {
    const { container } = render(
      <BulkActionBar selectedTickets={[]} audioId="a-1" jiraConnected={true} onCleared={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows 'Approve N' when only DRAFTs are selected", () => {
    render(
      <BulkActionBar
        selectedTickets={[draft("t-1"), draft("t-2")]}
        audioId="a-1"
        jiraConnected={true}
        onCleared={vi.fn()}
      />,
    );
    expect(screen.getByText(/approve 2/i)).toBeInTheDocument();
    expect(screen.queryByText(/export/i)).not.toBeInTheDocument();
  });

  it("shows 'Export N' when only APPROVEDs are selected and Jira is connected", () => {
    render(
      <BulkActionBar
        selectedTickets={[approved("t-3")]}
        audioId="a-1"
        jiraConnected={true}
        onCleared={vi.fn()}
      />,
    );
    expect(screen.getByText(/export 1/i)).toBeInTheDocument();
  });

  it("shows 'Connect Jira' CTA when APPROVEDs are selected but Jira is disconnected", () => {
    render(
      <BulkActionBar
        selectedTickets={[approved("t-3")]}
        audioId="a-1"
        jiraConnected={false}
        onCleared={vi.fn()}
      />,
    );
    expect(screen.getByText(/connect jira/i)).toBeInTheDocument();
  });

  it("shows both 'Approve N' and 'Export N' when selection is mixed and Jira is connected", () => {
    render(
      <BulkActionBar
        selectedTickets={[draft("t-1"), approved("t-2")]}
        audioId="a-1"
        jiraConnected={true}
        onCleared={vi.fn()}
      />,
    );
    expect(screen.getByText(/approve 1/i)).toBeInTheDocument();
    expect(screen.getByText(/export 1/i)).toBeInTheDocument();
  });

  it("clicking Approve calls the approve endpoint per draft and clears selection", async () => {
    const user = userEvent.setup();
    const onCleared = vi.fn();
    mockApiFetcher.mockResolvedValue({});
    render(
      <BulkActionBar
        selectedTickets={[draft("t-1"), draft("t-2")]}
        audioId="a-9"
        jiraConnected={true}
        onCleared={onCleared}
      />,
    );
    await user.click(screen.getByText(/approve 2/i));

    await waitFor(() => {
      expect(mockApiFetcher).toHaveBeenCalledWith("/v1/tickets/t-1/approve", { method: "POST" });
      expect(mockApiFetcher).toHaveBeenCalledWith("/v1/tickets/t-2/approve", { method: "POST" });
    });
    expect(mockInvalidateQuery).toHaveBeenCalledWith("/v1/audio/a-9");
    expect(onCleared).toHaveBeenCalled();
  });

  it("toasts an error and keeps selection if any approve fails", async () => {
    const user = userEvent.setup();
    const onCleared = vi.fn();
    mockApiFetcher.mockRejectedValue(new Error("boom"));
    render(
      <BulkActionBar
        selectedTickets={[draft("t-1")]}
        audioId="a-9"
        jiraConnected={true}
        onCleared={onCleared}
      />,
    );
    await user.click(screen.getByText(/approve 1/i));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(expect.stringContaining("failed to approve"));
    });
    expect(onCleared).not.toHaveBeenCalled();
  });

  it("clicking Export calls the bulk export endpoint with approved ids", async () => {
    const user = userEvent.setup();
    const onCleared = vi.fn();
    mockApiFetcher.mockResolvedValue({});
    render(
      <BulkActionBar
        selectedTickets={[approved("t-1"), approved("t-2")]}
        audioId="a-9"
        jiraConnected={true}
        onCleared={onCleared}
      />,
    );
    await user.click(screen.getByText(/export 2/i));

    await waitFor(() => {
      expect(mockApiFetcher).toHaveBeenCalledWith("/v1/integrations/jira/export-bulk", {
        data: { ticketIds: ["t-1", "t-2"] },
        method: "POST",
      });
    });
    expect(mockInvalidateQuery).toHaveBeenCalledWith("/v1/audio/a-9");
    expect(onCleared).toHaveBeenCalled();
  });

  it("disables Approve while approve is in flight", async () => {
    const user = userEvent.setup();
    let resolveApprove!: (value?: unknown) => void;
    mockApiFetcher.mockReturnValue(
      new Promise((resolve) => {
        resolveApprove = resolve;
      }),
    );
    render(
      <BulkActionBar
        selectedTickets={[draft("t-1")]}
        audioId="a-9"
        jiraConnected={true}
        onCleared={vi.fn()}
      />,
    );

    await user.click(screen.getByText(/approve 1/i));

    await waitFor(() => {
      expect(screen.getByText(/approve 1/i).closest("button")).toBeDisabled();
    });
    resolveApprove();
  });
});
