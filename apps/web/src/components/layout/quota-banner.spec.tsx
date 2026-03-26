import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { QuotaBanner } from "./quota-banner";

const mockUseQuota = vi.fn();

vi.mock("@/features/settings/hooks/use-quota", () => ({
  useQuota: () => mockUseQuota(),
}));

describe("QuotaBanner", () => {
  it("should not render when usage is below 90%", () => {
    mockUseQuota.mockReturnValue({
      quota: { limitMinutes: 30, usedMinutes: 10 },
      isLoading: false,
      usagePercentage: 33,
    });

    const { container } = render(<QuotaBanner />);

    expect(container.innerHTML).toBe("");
  });

  it("should not render when loading", () => {
    mockUseQuota.mockReturnValue({
      quota: undefined,
      isLoading: true,
      usagePercentage: 0,
    });

    const { container } = render(<QuotaBanner />);

    expect(container.innerHTML).toBe("");
  });

  it("should show warning at 90% usage", () => {
    mockUseQuota.mockReturnValue({
      quota: { limitMinutes: 30, usedMinutes: 27 },
      isLoading: false,
      usagePercentage: 90,
    });

    render(<QuotaBanner />);

    expect(screen.getByText(/90% de tu quota/)).toBeInTheDocument();
    expect(screen.getByText(/27 \/ 30 min/)).toBeInTheDocument();
  });

  it("should show warning at 95% usage", () => {
    mockUseQuota.mockReturnValue({
      quota: { limitMinutes: 30, usedMinutes: 28.5 },
      isLoading: false,
      usagePercentage: 95,
    });

    render(<QuotaBanner />);

    expect(screen.getByText(/95% de tu quota/)).toBeInTheDocument();
  });

  it("should show exhausted message at 100% usage", () => {
    mockUseQuota.mockReturnValue({
      quota: { limitMinutes: 30, usedMinutes: 30 },
      isLoading: false,
      usagePercentage: 100,
    });

    render(<QuotaBanner />);

    expect(screen.getByText(/Has alcanzado tu límite mensual/)).toBeInTheDocument();
    expect(screen.getByText(/30 \/ 30 min/)).toBeInTheDocument();
  });
});
