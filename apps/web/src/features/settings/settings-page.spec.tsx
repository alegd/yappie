import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SettingsPage } from "./settings-page";

vi.mock("./settings-tabs", () => ({
  SettingsTabs: () => <div data-testid="settings-tabs" />,
}));

describe("SettingsPage", () => {
  it("should render the settings tabs container", () => {
    render(<SettingsPage />);
    expect(screen.getByTestId("settings-tabs")).toBeInTheDocument();
  });
});
