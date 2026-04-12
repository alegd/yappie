import { describe, expect, it, vi } from "vitest";
import { useBillingStatus } from "./use-billing-status";

const mockUseQuery = vi.fn();

vi.mock("@/hooks/use-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

describe("useBillingStatus", () => {
  it("should return billing status data", () => {
    mockUseQuery.mockReturnValue({
      data: {
        plan: "PRO",
        stripeSubscriptionId: "sub_123",
        cancelAtPeriodEnd: false,
      },
      isLoading: false,
      error: undefined,
    });

    const result = useBillingStatus();

    expect(result.status?.plan).toBe("PRO");
    expect(result.status?.stripeSubscriptionId).toBe("sub_123");
    expect(result.status?.cancelAtPeriodEnd).toBe(false);
  });

  it("should call useQuery with billing status endpoint", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, error: undefined });

    useBillingStatus();

    expect(mockUseQuery).toHaveBeenCalledWith("/v1/billing/status");
  });

  it("should surface loading state", () => {
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: true, error: undefined });

    const result = useBillingStatus();

    expect(result.isLoading).toBe(true);
    expect(result.status).toBeUndefined();
  });

  it("should surface errors", () => {
    const err = new Error("Unauthorized");
    mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, error: err });

    const result = useBillingStatus();

    expect(result.error).toBe(err);
  });
});
