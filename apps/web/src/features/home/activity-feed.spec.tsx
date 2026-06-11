import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActivityFeed } from "./activity-feed";

const { mockUseQuery, mockInvalidateQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockInvalidateQuery: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: mockInvalidateQuery,
}));

vi.mock("./activity-item", () => ({
  ActivityItemRow: ({ item }: { item: { audioId?: string; ticketId?: string } }) => (
    <div data-testid={`row-${item.audioId ?? item.ticketId}`} />
  ),
}));

describe("ActivityFeed", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a loading state while data is loading", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
      mutate: vi.fn(),
    });
    render(<ActivityFeed />);
    expect(screen.getByLabelText(/loading activity/i)).toBeInTheDocument();
  });

  it("renders one row per item", () => {
    mockUseQuery.mockReturnValue({
      data: {
        data: [
          {
            type: "audio.uploaded",
            audioId: "a-1",
            fileName: "x.webm",
            projectId: "p",
            projectName: "P",
            at: "2026-06-11T10:00:00Z",
          },
          {
            type: "ticket.exported",
            ticketId: "t-1",
            ticketTitle: "X",
            jiraIssueKey: "K-1",
            jiraIssueUrl: null,
            projectId: "p",
            projectName: "P",
            at: "2026-06-11T11:00:00Z",
          },
        ],
        total: 2,
      },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(<ActivityFeed />);
    expect(screen.getByTestId("row-a-1")).toBeInTheDocument();
    expect(screen.getByTestId("row-t-1")).toBeInTheDocument();
  });

  it("renders an empty state when no items", () => {
    mockUseQuery.mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    render(<ActivityFeed />);
    expect(screen.getByText(/nothing yet/i)).toBeInTheDocument();
  });

  it("renders a refresh button that invalidates the query", async () => {
    mockUseQuery.mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false,
      error: undefined,
      mutate: vi.fn(),
    });
    const u = userEvent.setup();
    render(<ActivityFeed />);
    await u.click(screen.getByLabelText(/refresh activity/i));
    expect(mockInvalidateQuery).toHaveBeenCalledWith("/v1/activity?limit=10");
  });
});
