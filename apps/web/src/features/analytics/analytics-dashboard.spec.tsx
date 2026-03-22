import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalyticsDashboard } from "./analytics-dashboard";

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: vi.fn(),
}));

describe("AnalyticsDashboard", () => {
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
    render(<AnalyticsDashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should display event counts", async () => {
    mockUseQuery.mockReturnValue({
      data: [
        { type: "audio.uploaded", count: 12 },
        { type: "ticket.generated", count: 35 },
        { type: "ticket.exported", count: 8 },
      ],
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<AnalyticsDashboard />);

    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByText("35")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("should show empty state when no data", async () => {
    mockUseQuery.mockReturnValue({ data: [], error: undefined, isLoading: false, mutate: vi.fn() });
    render(<AnalyticsDashboard />);
    expect(await screen.findByText(/no analytics/i)).toBeInTheDocument();
  });
});
