import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnalyticsDashboard } from "./analytics-dashboard";

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: mockGet,
    setToken: vi.fn(),
  },
}));

describe("AnalyticsDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state", () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<AnalyticsDashboard />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should display event counts", async () => {
    mockGet.mockResolvedValue([
      { type: "audio.uploaded", count: 12 },
      { type: "ticket.generated", count: 35 },
      { type: "ticket.exported", count: 8 },
    ]);

    render(<AnalyticsDashboard />);

    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByText("35")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });

  it("should show empty state when no data", async () => {
    mockGet.mockResolvedValue([]);
    render(<AnalyticsDashboard />);
    expect(await screen.findByText(/no analytics/i)).toBeInTheDocument();
  });
});
