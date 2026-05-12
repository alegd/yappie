import { render } from "@testing-library/react-native";
import { QuotaWidget } from "./quota-widget";
import type { Quota } from "@/lib/api/types";

function buildQuota(overrides: Partial<Quota> = {}): Quota {
  return {
    plan: "FREE",
    limitMinutes: 20,
    usedMinutes: 5,
    remainingMinutes: 15,
    cycleStartDate: "2026-05-01",
    cycleEndDate: "2026-05-31",
    ...overrides,
  };
}

describe("QuotaWidget", () => {
  it("renders plan name", () => {
    const { getByText } = render(<QuotaWidget quota={buildQuota({ plan: "FREE" })} />);
    expect(getByText(/free/i)).toBeTruthy();
  });

  it("renders used/limit minutes", () => {
    const { getByText } = render(
      <QuotaWidget quota={buildQuota({ usedMinutes: 8, limitMinutes: 20 })} />,
    );
    expect(getByText("8 / 20 min")).toBeTruthy();
  });

  it("shows upgrade link when plan is FREE", () => {
    const { getByText } = render(<QuotaWidget quota={buildQuota({ plan: "FREE" })} />);
    expect(getByText(/upgrade/i)).toBeTruthy();
  });

  it("does NOT show upgrade link when plan is PRO", () => {
    const { queryByText } = render(<QuotaWidget quota={buildQuota({ plan: "PRO" })} />);
    expect(queryByText(/upgrade/i)).toBeNull();
  });
});
