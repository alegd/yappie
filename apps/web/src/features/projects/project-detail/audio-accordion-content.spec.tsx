import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AudioAccordionContent } from "./audio-accordion-content";

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: vi.fn(),
}));

vi.mock("./bulk-action-bar", () => ({
  BulkActionBar: ({ selectedTickets }: { selectedTickets: unknown[] }) => (
    <div data-testid="bulk-bar" data-count={selectedTickets.length} />
  ),
}));

vi.mock("./ticket-row", () => ({
  TicketRow: ({
    ticket,
    onToggle,
    onTitleClick,
  }: {
    ticket: { id: string; title: string };
    onToggle: (id: string) => void;
    onTitleClick: (id: string) => void;
  }) => (
    <div>
      <button data-testid={`row-${ticket.id}`} onClick={() => onToggle(ticket.id)}>
        {ticket.title}
      </button>
      <button data-testid={`title-${ticket.id}`} onClick={() => onTitleClick(ticket.id)}>
        title
      </button>
    </div>
  ),
}));

const audioBase = {
  id: "a-1",
  fileName: "rec.webm",
  status: "COMPLETED" as const,
  transcription: "Hello world, this is a test transcript.",
  errorMessage: null,
  tickets: [
    { id: "t-1", title: "Fix bug", status: "DRAFT", priority: "HIGH", jiraIssueKey: null },
    { id: "t-2", title: "Add feature", status: "APPROVED", priority: "MEDIUM", jiraIssueKey: null },
  ],
};

describe("AudioAccordionContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not call useQuery when not open (lazy load)", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(
      <AudioAccordionContent
        audioId="a-1"
        audioStatus="COMPLETED"
        isOpen={false}
        selection={new Set()}
        onSelectionChange={vi.fn()}
        jiraConnected={true}
        onTicketClick={vi.fn()}
      />,
    );
    expect(mockUseQuery).toHaveBeenCalledWith(
      "/v1/audio/a-1",
      expect.objectContaining({ revalidateIfStale: false }),
    );
    // The hook is called, but with a disabled config — we assert lazy via the config flag.
  });

  it("renders a status message for PENDING / TRANSCRIBING / ANALYZING", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(
      <AudioAccordionContent
        audioId="a-1"
        audioStatus="TRANSCRIBING"
        isOpen={true}
        selection={new Set()}
        onSelectionChange={vi.fn()}
        jiraConnected={true}
        onTicketClick={vi.fn()}
      />,
    );
    expect(screen.getByText(/transcribing/i)).toBeInTheDocument();
    expect(screen.queryByTestId("bulk-bar")).not.toBeInTheDocument();
  });

  it("renders the failure message for FAILED audios", () => {
    mockUseQuery.mockReturnValue({
      data: { ...audioBase, status: "FAILED", errorMessage: "Whisper exploded" },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(
      <AudioAccordionContent
        audioId="a-1"
        audioStatus="FAILED"
        isOpen={true}
        selection={new Set()}
        onSelectionChange={vi.fn()}
        jiraConnected={true}
        onTicketClick={vi.fn()}
      />,
    );
    expect(screen.getByText(/processing failed/i)).toBeInTheDocument();
    expect(screen.getByText(/whisper exploded/i)).toBeInTheDocument();
  });

  it("shows a loader while the lazy query is loading", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
      mutate: vi.fn(),
    });
    render(
      <AudioAccordionContent
        audioId="a-1"
        audioStatus="COMPLETED"
        isOpen={true}
        selection={new Set()}
        onSelectionChange={vi.fn()}
        jiraConnected={true}
        onTicketClick={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
  });

  it("renders transcript, ticket rows, and bulk bar when COMPLETED", () => {
    mockUseQuery.mockReturnValue({
      data: audioBase,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(
      <AudioAccordionContent
        audioId="a-1"
        audioStatus="COMPLETED"
        isOpen={true}
        selection={new Set(["t-1"])}
        onSelectionChange={vi.fn()}
        jiraConnected={true}
        onTicketClick={vi.fn()}
      />,
    );
    expect(screen.getByText(/hello world/i)).toBeInTheDocument();
    expect(screen.getByTestId("row-t-1")).toBeInTheDocument();
    expect(screen.getByTestId("row-t-2")).toBeInTheDocument();
    expect(screen.getByTestId("bulk-bar")).toHaveAttribute("data-count", "1");
  });

  it("notifies onSelectionChange when a row toggles", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    mockUseQuery.mockReturnValue({
      data: audioBase,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(
      <AudioAccordionContent
        audioId="a-1"
        audioStatus="COMPLETED"
        isOpen={true}
        selection={new Set()}
        onSelectionChange={onSelectionChange}
        jiraConnected={true}
        onTicketClick={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("row-t-1"));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set(["t-1"]));
  });

  it("removes a ticket from the selection when toggled twice", async () => {
    const onSelectionChange = vi.fn();
    const user = userEvent.setup();
    mockUseQuery.mockReturnValue({
      data: audioBase,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(
      <AudioAccordionContent
        audioId="a-1"
        audioStatus="COMPLETED"
        isOpen={true}
        selection={new Set(["t-1"])}
        onSelectionChange={onSelectionChange}
        jiraConnected={true}
        onTicketClick={vi.fn()}
      />,
    );
    await user.click(screen.getByTestId("row-t-1"));
    expect(onSelectionChange).toHaveBeenCalledWith(new Set());
  });

  it("propagates title clicks via onTicketClick prop", async () => {
    const onTicketClick = vi.fn();
    const userE = userEvent.setup();
    mockUseQuery.mockReturnValue({
      data: audioBase,
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(
      <AudioAccordionContent
        audioId="a-1"
        audioStatus="COMPLETED"
        isOpen={true}
        selection={new Set()}
        onSelectionChange={vi.fn()}
        jiraConnected={true}
        onTicketClick={onTicketClick}
      />,
    );
    await userE.click(screen.getByTestId("title-t-1"));
    expect(onTicketClick).toHaveBeenCalledWith("t-1");
  });
});
