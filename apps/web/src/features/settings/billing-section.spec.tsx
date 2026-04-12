import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BillingSection } from "./billing-section";

const {
  mockApiFetcher,
  mockUseBillingStatus,
  mockToastError,
  mockToastSuccess,
  mockRouterReplace,
  mockSearchParamsGet,
} = vi.hoisted(() => ({
  mockApiFetcher: vi.fn(),
  mockUseBillingStatus: vi.fn(),
  mockToastError: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockRouterReplace: vi.fn(),
  mockSearchParamsGet: vi.fn(),
}));

vi.mock("@/lib/api-fetcher", () => ({
  apiFetcher: mockApiFetcher,
}));

vi.mock("./hooks/use-billing-status", () => ({
  useBillingStatus: mockUseBillingStatus,
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  toast: {
    error: mockToastError,
    success: mockToastSuccess,
    info: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace }),
  useSearchParams: () => ({ get: mockSearchParamsGet }),
  usePathname: () => "/dashboard/settings",
}));

function mockLocation() {
  const original = window.location;
  Object.defineProperty(window, "location", { writable: true, value: { href: "" } });
  return () => Object.defineProperty(window, "location", { writable: true, value: original });
}

describe("BillingSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsGet.mockReturnValue(null);
  });

  it("should render the Billing heading", () => {
    mockUseBillingStatus.mockReturnValue({
      status: { plan: "FREE", stripeSubscriptionId: null, cancelAtPeriodEnd: false },
      isLoading: false,
    });

    render(<BillingSection />);

    expect(screen.getByRole("heading", { name: "Billing" })).toBeInTheDocument();
  });

  describe("when on Free plan", () => {
    beforeEach(() => {
      mockUseBillingStatus.mockReturnValue({
        status: { plan: "FREE", stripeSubscriptionId: null, cancelAtPeriodEnd: false },
        isLoading: false,
      });
    });

    it("should display Free plan", () => {
      render(<BillingSection />);

      expect(screen.getByText(/free/i)).toBeInTheDocument();
    });

    it("should show Upgrade to Pro button", () => {
      render(<BillingSection />);

      expect(screen.getByRole("button", { name: /upgrade to pro/i })).toBeInTheDocument();
    });

    it("should not show Manage subscription button", () => {
      render(<BillingSection />);

      expect(
        screen.queryByRole("button", { name: /manage subscription/i }),
      ).not.toBeInTheDocument();
    });

    it("should redirect to Stripe Checkout when Upgrade to Pro is clicked", async () => {
      const user = userEvent.setup();
      const restore = mockLocation();
      mockApiFetcher.mockResolvedValue({ url: "https://checkout.stripe.com/session_abc" });

      render(<BillingSection />);

      await user.click(screen.getByRole("button", { name: /upgrade to pro/i }));

      await waitFor(() => {
        expect(mockApiFetcher).toHaveBeenCalledWith("/v1/billing/checkout-session", {
          method: "POST",
        });
        expect(window.location.href).toBe("https://checkout.stripe.com/session_abc");
      });

      restore();
    });

    it("should show toast error when checkout-session fails", async () => {
      const user = userEvent.setup();
      mockApiFetcher.mockRejectedValue(new Error("Stripe unavailable"));

      render(<BillingSection />);

      await user.click(screen.getByRole("button", { name: /upgrade to pro/i }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Stripe unavailable");
      });
    });
  });

  describe("when on Pro plan", () => {
    beforeEach(() => {
      mockUseBillingStatus.mockReturnValue({
        status: { plan: "PRO", stripeSubscriptionId: "sub_123", cancelAtPeriodEnd: false },
        isLoading: false,
      });
    });

    it("should display Pro plan", () => {
      render(<BillingSection />);

      expect(screen.getByText(/pro/i)).toBeInTheDocument();
    });

    it("should show Manage subscription button", () => {
      render(<BillingSection />);

      expect(screen.getByRole("button", { name: /manage subscription/i })).toBeInTheDocument();
    });

    it("should not show Upgrade to Pro button", () => {
      render(<BillingSection />);

      expect(screen.queryByRole("button", { name: /upgrade to pro/i })).not.toBeInTheDocument();
    });

    it("should redirect to Stripe Customer Portal when Manage subscription is clicked", async () => {
      const user = userEvent.setup();
      const restore = mockLocation();
      mockApiFetcher.mockResolvedValue({ url: "https://billing.stripe.com/portal_xyz" });

      render(<BillingSection />);

      await user.click(screen.getByRole("button", { name: /manage subscription/i }));

      await waitFor(() => {
        expect(mockApiFetcher).toHaveBeenCalledWith("/v1/billing/portal-session", {
          method: "POST",
        });
        expect(window.location.href).toBe("https://billing.stripe.com/portal_xyz");
      });

      restore();
    });
  });

  describe("when subscription is scheduled to cancel", () => {
    beforeEach(() => {
      mockUseBillingStatus.mockReturnValue({
        status: { plan: "PRO", stripeSubscriptionId: "sub_123", cancelAtPeriodEnd: true },
        isLoading: false,
      });
    });

    it("should show cancellation notice", () => {
      render(<BillingSection />);

      expect(screen.getByText(/will cancel at the end of the current period/i)).toBeInTheDocument();
    });
  });

  describe("when loading", () => {
    it("should not crash without status data", () => {
      mockUseBillingStatus.mockReturnValue({ status: undefined, isLoading: true });

      render(<BillingSection />);

      expect(screen.getByRole("heading", { name: "Billing" })).toBeInTheDocument();
    });
  });

  describe("post-checkout feedback (?upgraded=true)", () => {
    it("should show a success toast when upgraded=true is in the URL", async () => {
      mockSearchParamsGet.mockImplementation((key: string) => (key === "upgraded" ? "true" : null));
      const mutate = vi.fn();
      mockUseBillingStatus.mockReturnValue({
        status: { plan: "PRO", stripeSubscriptionId: "sub_1", cancelAtPeriodEnd: false },
        isLoading: false,
        mutate,
      });

      render(<BillingSection />);

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(expect.stringMatching(/pro/i));
      });
    });

    it("should revalidate billing status when upgraded=true", async () => {
      mockSearchParamsGet.mockImplementation((key: string) => (key === "upgraded" ? "true" : null));
      const mutate = vi.fn();
      mockUseBillingStatus.mockReturnValue({
        status: { plan: "FREE", stripeSubscriptionId: null, cancelAtPeriodEnd: false },
        isLoading: false,
        mutate,
      });

      render(<BillingSection />);

      await waitFor(() => {
        expect(mutate).toHaveBeenCalled();
      });
    });

    it("should remove the upgraded param from the URL", async () => {
      mockSearchParamsGet.mockImplementation((key: string) => (key === "upgraded" ? "true" : null));
      mockUseBillingStatus.mockReturnValue({
        status: { plan: "PRO", stripeSubscriptionId: "sub_1", cancelAtPeriodEnd: false },
        isLoading: false,
        mutate: vi.fn(),
      });

      render(<BillingSection />);

      await waitFor(() => {
        expect(mockRouterReplace).toHaveBeenCalledWith("/dashboard/settings");
      });
    });

    it("should not show toast when upgraded param is missing", () => {
      mockSearchParamsGet.mockReturnValue(null);
      mockUseBillingStatus.mockReturnValue({
        status: { plan: "FREE", stripeSubscriptionId: null, cancelAtPeriodEnd: false },
        isLoading: false,
        mutate: vi.fn(),
      });

      render(<BillingSection />);

      expect(mockToastSuccess).not.toHaveBeenCalled();
      expect(mockRouterReplace).not.toHaveBeenCalled();
    });
  });
});
