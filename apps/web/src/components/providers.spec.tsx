import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Providers } from "./providers";

vi.mock("next-auth/react", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}));

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/config/swr.config", () => ({
  SwrConfig: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("next-intl", () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe("Providers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children", () => {
    render(
      <Providers locale="en" messages={{}}>
        <div>App content</div>
      </Providers>,
    );

    expect(screen.getByText("App content")).toBeInTheDocument();
  });
});
