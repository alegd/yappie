import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppearanceSection } from "./appearance-section";

vi.mock("@/components/ui/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

describe("AppearanceSection", () => {
  it("should render the Appearance heading", () => {
    render(<AppearanceSection />);

    expect(screen.getByRole("heading", { name: "Appearance" })).toBeInTheDocument();
  });

  it("should render the ThemeToggle component", () => {
    render(<AppearanceSection />);

    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
  });

  it("should render the Theme label and description", () => {
    render(<AppearanceSection />);

    expect(screen.getByText("Theme")).toBeInTheDocument();
    expect(screen.getByText("Choose light, dark, or system preference")).toBeInTheDocument();
  });
});
