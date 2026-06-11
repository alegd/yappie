import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsTabs } from "./settings-tabs";

vi.mock("./appearance-section", () => ({
  AppearanceSection: () => <div data-testid="general-appearance" />,
}));
vi.mock("./quota-usage", () => ({
  QuotaUsage: () => <div data-testid="general-quota" />,
}));
vi.mock("./billing-section", () => ({
  BillingSection: () => <div data-testid="general-billing" />,
}));
vi.mock("./integrations-section", () => ({
  IntegrationsSection: () => <div data-testid="integ-jira" />,
}));
vi.mock("./templates-section", () => ({
  TemplatesSection: () => <div data-testid="integ-templates" />,
}));
vi.mock("./tabs/analytics-tab", () => ({
  AnalyticsTab: () => <div data-testid="analytics" />,
}));
vi.mock("./account-deletion-section", () => ({
  AccountDeletionSection: () => <div data-testid="danger" />,
}));

describe("SettingsTabs", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") window.location.hash = "";
  });

  it("renders 4 tabs", () => {
    render(<SettingsTabs />);
    expect(screen.getByRole("tab", { name: /general/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /integrations/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /analytics/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /danger zone/i })).toBeInTheDocument();
  });

  it("defaults to General tab content", () => {
    render(<SettingsTabs />);
    expect(screen.getByTestId("general-appearance")).toBeInTheDocument();
    expect(screen.getByTestId("general-quota")).toBeInTheDocument();
    expect(screen.getByTestId("general-billing")).toBeInTheDocument();
    expect(screen.queryByTestId("integ-jira")).not.toBeInTheDocument();
  });

  it("switches to Integrations when that tab is clicked", async () => {
    const u = userEvent.setup();
    render(<SettingsTabs />);
    await u.click(screen.getByRole("tab", { name: /integrations/i }));
    expect(screen.getByTestId("integ-jira")).toBeInTheDocument();
    expect(screen.getByTestId("integ-templates")).toBeInTheDocument();
    expect(screen.queryByTestId("general-appearance")).not.toBeInTheDocument();
  });

  it("switches to Analytics when that tab is clicked", async () => {
    const u = userEvent.setup();
    render(<SettingsTabs />);
    await u.click(screen.getByRole("tab", { name: /analytics/i }));
    expect(screen.getByTestId("analytics")).toBeInTheDocument();
  });

  it("switches to Danger zone when that tab is clicked", async () => {
    const u = userEvent.setup();
    render(<SettingsTabs />);
    await u.click(screen.getByRole("tab", { name: /danger zone/i }));
    expect(screen.getByTestId("danger")).toBeInTheDocument();
  });

  it("reads initial tab from URL hash on mount", () => {
    window.location.hash = "#integrations";
    render(<SettingsTabs />);
    expect(screen.getByTestId("integ-jira")).toBeInTheDocument();
  });

  it("ignores unknown hash and falls back to General", () => {
    window.location.hash = "#nope";
    render(<SettingsTabs />);
    expect(screen.getByTestId("general-appearance")).toBeInTheDocument();
  });
});
