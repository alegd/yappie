import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AnalyticsTab } from "./analytics-tab";

vi.mock("@/features/analytics/analytics-dashboard", () => ({
  AnalyticsDashboard: () => <div data-testid="analytics-dashboard" />,
}));

describe("AnalyticsTab", () => {
  it("renders the existing AnalyticsDashboard", () => {
    render(<AnalyticsTab />);
    expect(screen.getByTestId("analytics-dashboard")).toBeInTheDocument();
  });
});
