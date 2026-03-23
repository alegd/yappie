import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardContent } from "./dashboard-content";

const { mockSignOut, mockSetToken, mockSidebarProps } = vi.hoisted(() => ({
  mockSignOut: vi.fn(),
  mockSetToken: vi.fn(),
  mockSidebarProps: { user: null as any, onLogout: null as any },
}));

vi.mock("next-auth/react", () => ({
  signOut: mockSignOut,
}));

vi.mock("@/lib/api", () => ({
  api: {
    setToken: mockSetToken,
  },
}));

vi.mock("./sidebar", () => ({
  Sidebar: ({ user, onLogout }: any) => {
    mockSidebarProps.user = user;
    mockSidebarProps.onLogout = onLogout;
    return (
      <div data-testid="sidebar">
        <span data-testid="sidebar-user">{user?.name}</span>
        <button data-testid="sidebar-logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    );
  },
}));

const defaultProps = {
  accessToken: "test-token-123",
  user: { name: "Jane Doe", email: "jane@example.com" },
};

describe("DashboardContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSidebarProps.user = null;
    mockSidebarProps.onLogout = null;
  });

  it("should set API token on render", () => {
    render(
      <DashboardContent {...defaultProps}>
        <div>Content</div>
      </DashboardContent>,
    );

    expect(mockSetToken).toHaveBeenCalledWith("test-token-123");
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

  it("should call signOut with login page redirect on logout", async () => {
    const user = userEvent.setup();

    render(
      <DashboardContent {...defaultProps}>
        <div>Content</div>
      </DashboardContent>,
    );

    await user.click(screen.getByTestId("sidebar-logout"));

    expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });
});
