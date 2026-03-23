import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./theme-toggle";

const { mockSetTheme, mockTheme } = vi.hoisted(() => ({
  mockSetTheme: vi.fn(),
  mockTheme: { value: "dark" },
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: mockTheme.value,
    setTheme: mockSetTheme,
  }),
}));

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTheme.value = "dark";
  });

  it("should render light, dark, and system buttons", () => {
    render(<ThemeToggle />);

    expect(screen.getByRole("button", { name: "Light theme" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dark theme" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "System theme" })).toBeInTheDocument();
  });

  it("should call setTheme when light button clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Light theme" }));

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("should call setTheme when dark button clicked", async () => {
    const user = userEvent.setup();
    mockTheme.value = "light";
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "Dark theme" }));

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("should call setTheme when system button clicked", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole("button", { name: "System theme" }));

    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });
});
