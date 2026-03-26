import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsPage } from "./settings-page";

vi.mock("./quota-usage", () => ({
  QuotaUsage: () => <div data-testid="quota-usage" />,
}));

vi.mock("./appearance-section", () => ({
  AppearanceSection: () => <div data-testid="appearance-section" />,
}));

vi.mock("./integrations-section", () => ({
  IntegrationsSection: () => <div data-testid="integrations-section" />,
}));

vi.mock("./templates-section", () => ({
  TemplatesSection: () => <div data-testid="templates-section" />,
}));

describe("SettingsPage", () => {
  it("should render page title", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("should render Plan & Usage section", () => {
    render(<SettingsPage />);
    expect(screen.getByText("Plan & Usage")).toBeInTheDocument();
    expect(screen.getByTestId("quota-usage")).toBeInTheDocument();
  });

  it("should render all sections", () => {
    render(<SettingsPage />);
    expect(screen.getByTestId("appearance-section")).toBeInTheDocument();
    expect(screen.getByTestId("integrations-section")).toBeInTheDocument();
    expect(screen.getByTestId("templates-section")).toBeInTheDocument();
  });
});
