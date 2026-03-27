import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthProviders } from "./auth-providers";

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}));

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

describe("AuthProviders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children within SessionProvider and ThemeProvider", () => {
    render(
      <AuthProviders>
        <div>Auth content</div>
      </AuthProviders>,
    );

    expect(screen.getByText("Auth content")).toBeInTheDocument();
    expect(screen.getByTestId("session-provider")).toBeInTheDocument();
    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
  });
});
