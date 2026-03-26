import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuotaUsage } from "./quota-usage";

const mockUseQuota = vi.fn();

vi.mock("./hooks/use-quota", () => ({
  useQuota: () => mockUseQuota(),
}));

describe("QuotaUsage", () => {
  it("should show loading skeleton when loading", () => {
    mockUseQuota.mockReturnValue({ quota: undefined, isLoading: true, usagePercentage: 0 });
    const { container } = render(<QuotaUsage />);

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("should display quota usage", () => {
    mockUseQuota.mockReturnValue({
      quota: { plan: "FREE", limitMinutes: 30, usedMinutes: 15, remainingMinutes: 15 },
      isLoading: false,
      usagePercentage: 50,
    });

    render(<QuotaUsage />);

    expect(screen.getByText("Uso este mes")).toBeInTheDocument();
    expect(screen.getByText("15 / 30 min")).toBeInTheDocument();
  });

  it("should show 0 usage for new user", () => {
    mockUseQuota.mockReturnValue({
      quota: { plan: "FREE", limitMinutes: 30, usedMinutes: 0, remainingMinutes: 30 },
      isLoading: false,
      usagePercentage: 0,
    });

    render(<QuotaUsage />);

    expect(screen.getByText("0 / 30 min")).toBeInTheDocument();
  });

  it("should cap progress bar at 100%", () => {
    mockUseQuota.mockReturnValue({
      quota: { plan: "FREE", limitMinutes: 30, usedMinutes: 35, remainingMinutes: 0 },
      isLoading: false,
      usagePercentage: 117,
    });

    render(<QuotaUsage />);

    expect(screen.getByText("35 / 30 min")).toBeInTheDocument();
  });
});
