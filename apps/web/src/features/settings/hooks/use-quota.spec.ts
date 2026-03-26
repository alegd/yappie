import { describe, expect, it, vi } from "vitest";
import { useQuota } from "./use-quota";

const mockUseQuery = vi.fn();

vi.mock("@/hooks/use-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

describe("useQuota", () => {
  it("should return quota data with usage percentage", () => {
    mockUseQuery.mockReturnValue({
      data: { plan: "FREE", limitMinutes: 30, usedMinutes: 15, remainingMinutes: 15 },
      isLoading: false,
      error: undefined,
    });

    const result = useQuota();

    expect(result.quota?.plan).toBe("FREE");
    expect(result.usagePercentage).toBe(50);
  });

  it("should return 0 percentage when no data", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: undefined,
    });

    const result = useQuota();

    expect(result.usagePercentage).toBe(0);
    expect(result.isLoading).toBe(true);
  });

  it("should call useQuery with quotas endpoint", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
    });

    useQuota();

    expect(mockUseQuery).toHaveBeenCalledWith("/v1/quotas");
  });

  it("should round percentage", () => {
    mockUseQuery.mockReturnValue({
      data: { plan: "FREE", limitMinutes: 30, usedMinutes: 10, remainingMinutes: 20 },
      isLoading: false,
      error: undefined,
    });

    const result = useQuota();

    expect(result.usagePercentage).toBe(33);
  });
});
