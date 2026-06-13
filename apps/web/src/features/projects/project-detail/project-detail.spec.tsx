import { render, screen } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectDetail } from "./project-detail";
import { useSocketEvents } from "@/hooks/use-socket-events";

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

const { mockUseSearchParams, mockRouterReplace } = vi.hoisted(() => ({
  mockUseSearchParams: vi.fn(() => new URLSearchParams()),
  mockRouterReplace: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: mockUseSearchParams,
  useRouter: () => ({ replace: mockRouterReplace }),
}));

vi.mock("./project-header", () => ({
  ProjectHeader: ({ project }: { project: { name: string } }) => (
    <div data-testid="project-header">{project.name}</div>
  ),
}));

vi.mock("./stats-footer", () => ({
  StatsFooter: ({ audios }: { audios: unknown[] }) => (
    <div data-testid="stats-footer" data-count={audios.length} />
  ),
}));

vi.mock("./empty-state", () => ({
  EmptyState: ({ projectId }: { projectId: string }) => (
    <div data-testid="empty-state">{projectId}</div>
  ),
}));

// Capture the most recent `isOpen` per audio so we can assert auto-expand.
const recordedOpen: Record<string, boolean> = {};

let lastAccordionOnTicketClick: ((id: string) => void) | undefined;
vi.mock("./audio-accordion", () => ({
  AudioAccordion: ({
    audio,
    isOpen,
    onTicketClick,
  }: {
    audio: { id: string; fileName: string };
    isOpen: boolean;
    onTicketClick: (id: string) => void;
  }) => {
    recordedOpen[audio.id] = isOpen;
    lastAccordionOnTicketClick = onTicketClick;
    return (
      <div data-testid={`accordion-${audio.id}`} data-open={String(isOpen)}>
        {audio.fileName}
      </div>
    );
  },
}));

let _lastDrawerTicketId: string | null = null;
let lastDrawerOnClose: (() => void) | undefined;
vi.mock("./ticket-detail-drawer", () => ({
  TicketDetailDrawer: ({ ticketId, onClose }: { ticketId: string | null; onClose: () => void }) => {
    _lastDrawerTicketId = ticketId;
    lastDrawerOnClose = onClose;
    return ticketId ? <div data-testid="ticket-drawer">{ticketId}</div> : null;
  },
}));

vi.mock("@radix-ui/react-accordion", () => ({
  Root: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="accordion-root">{children}</div>
  ),
}));

const project = {
  id: "p-1",
  name: "Marketing",
  description: "Desc",
  context: null,
  userId: "u-1",
  createdAt: "",
  updatedAt: "",
};

function setupQueries(opts: {
  project?: typeof project | undefined;
  projectLoading?: boolean;
  projectError?: Error;
  audios?: Array<{ id: string; fileName: string; status?: string; tickets?: unknown[] }>;
  audiosLoading?: boolean;
  jiraConnected?: boolean;
}) {
  let i = 0;
  mockUseQuery.mockImplementation(() => {
    // Cycle through the 3 queries (project, audios, jira) so re-renders
    // (e.g. after auto-expand) keep returning consistent data.
    const which = i++ % 3;
    if (which === 0) {
      return {
        data: opts.project,
        isLoading: opts.projectLoading ?? false,
        error: opts.projectError,
        mutate: vi.fn(),
      };
    }
    if (which === 1) {
      return {
        data: opts.audios
          ? { data: opts.audios, total: opts.audios.length, page: 1, limit: 50 }
          : undefined,
        isLoading: opts.audiosLoading ?? false,
        error: undefined,
        mutate: vi.fn(),
      };
    }
    return {
      data: { connected: opts.jiraConnected ?? false, siteName: null },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    };
  });
}

describe("ProjectDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    for (const k of Object.keys(recordedOpen)) delete recordedOpen[k];
    useSocketEvents.setState({ lastAudioCompleted: null });
  });

  it("shows a loader while the project is loading", () => {
    setupQueries({ projectLoading: true });
    render(<ProjectDetail id="p-1" />);
    expect(screen.getByLabelText(/loading project/i)).toBeInTheDocument();
  });

  it("shows an error message when the project query errors", () => {
    setupQueries({ projectError: new Error("boom") });
    render(<ProjectDetail id="p-1" />);
    expect(screen.getByText(/couldn.?t load this project/i)).toBeInTheDocument();
  });

  it("renders the empty state when there are no audios", () => {
    setupQueries({ project, audios: [] });
    render(<ProjectDetail id="p-1" />);
    expect(screen.getByTestId("project-header")).toHaveTextContent("Marketing");
    expect(screen.getByTestId("empty-state")).toHaveTextContent("p-1");
  });

  it("renders one accordion per audio plus the stats footer", () => {
    setupQueries({
      project,
      audios: [
        { id: "a-1", fileName: "rec1.webm" },
        { id: "a-2", fileName: "rec2.webm" },
      ],
    });
    render(<ProjectDetail id="p-1" />);
    expect(screen.getByTestId("accordion-a-1")).toBeInTheDocument();
    expect(screen.getByTestId("accordion-a-2")).toBeInTheDocument();
    expect(screen.getByTestId("stats-footer")).toHaveAttribute("data-count", "2");
  });

  it("auto-expands an audio when useSocketEvents emits a completion for that audioId", () => {
    setupQueries({
      project,
      audios: [
        { id: "a-1", fileName: "rec1.webm" },
        { id: "a-2", fileName: "rec2.webm" },
      ],
    });
    render(<ProjectDetail id="p-1" />);

    expect(recordedOpen["a-1"]).toBe(false);

    act(() => {
      useSocketEvents.getState().emitAudioCompleted({ audioId: "a-1", ticketCount: 3 });
    });

    expect(recordedOpen["a-1"]).toBe(true);
    // Other accordion stays as it was
    expect(recordedOpen["a-2"]).toBe(false);
  });

  it("ignores completion events for audios that are not part of this project", () => {
    setupQueries({
      project,
      audios: [{ id: "a-1", fileName: "rec1.webm" }],
    });
    render(<ProjectDetail id="p-1" />);

    act(() => {
      useSocketEvents.getState().emitAudioCompleted({ audioId: "a-999", ticketCount: 1 });
    });

    expect(recordedOpen["a-1"]).toBe(false);
  });

  it("does not render the drawer initially", () => {
    setupQueries({
      project,
      audios: [{ id: "a-1", fileName: "rec1.webm" }],
    });
    render(<ProjectDetail id="p-1" />);
    expect(screen.queryByTestId("ticket-drawer")).not.toBeInTheDocument();
  });

  it("opens the drawer when AudioAccordion fires onTicketClick", () => {
    setupQueries({
      project,
      audios: [{ id: "a-1", fileName: "rec1.webm" }],
    });
    render(<ProjectDetail id="p-1" />);

    act(() => {
      lastAccordionOnTicketClick?.("t-99");
    });

    expect(screen.getByTestId("ticket-drawer")).toHaveTextContent("t-99");
  });

  it("closes the drawer when onClose fires", () => {
    setupQueries({
      project,
      audios: [{ id: "a-1", fileName: "rec1.webm" }],
    });
    render(<ProjectDetail id="p-1" />);

    act(() => {
      lastAccordionOnTicketClick?.("t-99");
    });
    expect(screen.getByTestId("ticket-drawer")).toBeInTheDocument();

    act(() => {
      lastDrawerOnClose?.();
    });
    expect(screen.queryByTestId("ticket-drawer")).not.toBeInTheDocument();
  });

  it("opens the drawer with the ticket id from the ?ticket= query param", () => {
    setupQueries({
      project,
      audios: [
        { id: "a-1", fileName: "rec1.webm", tickets: [{ id: "t-1" }] },
        { id: "a-2", fileName: "rec2.webm" },
      ],
    });
    mockUseSearchParams.mockReturnValue(new URLSearchParams("ticket=t-1"));

    render(<ProjectDetail id="p-1" />);

    expect(screen.getByTestId("ticket-drawer")).toHaveTextContent("t-1");
  });

  it("opens the drawer even when the audio that owns the ticket is not loaded yet", () => {
    setupQueries({
      project,
      audios: [{ id: "a-1", fileName: "rec1.webm", tickets: [] }],
    });
    mockUseSearchParams.mockReturnValue(new URLSearchParams("ticket=t-99"));

    render(<ProjectDetail id="p-1" />);

    expect(screen.getByTestId("ticket-drawer")).toHaveTextContent("t-99");
  });

  it("calls router.replace to strip the ticket param when the drawer closes", () => {
    setupQueries({
      project,
      audios: [{ id: "a-1", fileName: "rec1.webm", tickets: [{ id: "t-1" }] }],
    });
    mockUseSearchParams.mockReturnValue(new URLSearchParams("ticket=t-1"));

    render(<ProjectDetail id="p-1" />);

    act(() => {
      lastDrawerOnClose?.();
    });

    expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard/projects/p-1", { scroll: false });
  });
});
