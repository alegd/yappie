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

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  BarChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Cell: () => null,
}));

const mockEvents = [
  { type: "audio.uploaded", count: 12 },
  { type: "ticket.generated", count: 35 },
  { type: "ticket.exported", count: 8 },
];

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

  it("should display event counts in stat cards", () => {
    mockUseQuery.mockReturnValue({
      data: mockEvents,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<AnalyticsDashboard />);

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("35")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("should display stat card labels", () => {
    mockUseQuery.mockReturnValue({
      data: mockEvents,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<AnalyticsDashboard />);

    expect(screen.getByText("Audios Uploaded")).toBeInTheDocument();
    expect(screen.getByText("Tickets Generated")).toBeInTheDocument();
    expect(screen.getByText("Tickets Exported")).toBeInTheDocument();
  });

  it("should render the bar chart when data exists", () => {
    mockUseQuery.mockReturnValue({
      data: mockEvents,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<AnalyticsDashboard />);

    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    expect(screen.getByText("Activity this month")).toBeInTheDocument();
  });

  it("should show empty state when no data", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
    render(<AnalyticsDashboard />);
    expect(screen.getByText(/no analytics/i)).toBeInTheDocument();
  });

  it("should not render chart in empty state", () => {
    mockUseQuery.mockReturnValue({
      data: [],
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });
    render(<AnalyticsDashboard />);
    expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
  });
});
