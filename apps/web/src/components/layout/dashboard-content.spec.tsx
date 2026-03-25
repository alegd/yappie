import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardContent } from "./dashboard-content";

vi.mock("@/components/ui/toast/toast-provider", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("./sidebar", () => ({
  Sidebar: ({ user }: { user: { name: string; email: string } }) => (
    <div data-testid="sidebar">
      <span data-testid="sidebar-user">{user?.name}</span>
    </div>
  ),
}));

const defaultProps = {
  user: { name: "Jane Doe", email: "jane@example.com" },
};

describe("DashboardContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render children content", () => {
    render(
      <DashboardContent {...defaultProps}>
        <div>Dashboard children</div>
      </DashboardContent>,
    );

    expect(screen.getByText("Dashboard children")).toBeInTheDocument();
  });

  it("should pass user to sidebar", () => {
    render(
      <DashboardContent {...defaultProps}>
        <div>Content</div>
      </DashboardContent>,
    );

    expect(screen.getByTestId("sidebar-user")).toHaveTextContent("Jane Doe");
  });
});
