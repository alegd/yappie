import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QuotaWidget } from "./quota-widget";

const { mockUseQuota, mockUseBillingStatus } = vi.hoisted(() => ({
  mockUseQuota: vi.fn(),
  mockUseBillingStatus: vi.fn(),
}));

vi.mock("@/features/settings/hooks/use-quota", () => ({
  useQuota: mockUseQuota,
}));

vi.mock("@/features/settings/hooks/use-billing-status", () => ({
  useBillingStatus: mockUseBillingStatus,
}));

vi.mock("next/link", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("QuotaWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBillingStatus.mockReturnValue({
      status: { plan: "FREE", stripeSubscriptionId: null, cancelAtPeriodEnd: false },
      isLoading: false,
    });
  });

  it("renders nothing while quota loads", () => {
    mockUseQuota.mockReturnValue({ quota: undefined, isLoading: true, usagePercentage: 0 });
    const { container } = render(<QuotaWidget />);
    expect(container.firstChild).toBeNull();
  });

  it("renders used / limit and plan label", () => {
    mockUseQuota.mockReturnValue({
      quota: {
        plan: "FREE",
        limitMinutes: 100,
        usedMinutes: 42,
        remainingMinutes: 58,
        cycleStartDate: "",
        cycleEndDate: "",
      },
      isLoading: false,
      usagePercentage: 42,
    });
    render(<QuotaWidget />);
    expect(screen.getByText(/42 \/ 100 min/i)).toBeInTheDocument();
    expect(screen.getByText(/free/i)).toBeInTheDocument();
  });

  it("shows Upgrade link only when plan is FREE", () => {
    mockUseQuota.mockReturnValue({
      quota: {
        plan: "FREE",
        limitMinutes: 100,
        usedMinutes: 10,
        remainingMinutes: 90,
        cycleStartDate: "",
        cycleEndDate: "",
      },
      isLoading: false,
      usagePercentage: 10,
    });
    render(<QuotaWidget />);
    expect(screen.getByRole("link", { name: /upgrade/i })).toBeInTheDocument();
  });

  it("hides Upgrade link when plan is PRO", () => {
    mockUseBillingStatus.mockReturnValue({
      status: { plan: "PRO", stripeSubscriptionId: "sub-1", cancelAtPeriodEnd: false },
      isLoading: false,
    });
    mockUseQuota.mockReturnValue({
      quota: {
        plan: "PRO",
        limitMinutes: 100,
        usedMinutes: 10,
        remainingMinutes: 90,
        cycleStartDate: "",
        cycleEndDate: "",
      },
      isLoading: false,
      usagePercentage: 10,
    });
    render(<QuotaWidget />);
    expect(screen.queryByRole("link", { name: /upgrade/i })).not.toBeInTheDocument();
  });
});
