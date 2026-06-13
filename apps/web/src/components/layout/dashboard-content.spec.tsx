import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardContent } from "./dashboard-content";

const { mockUseSession, mockUseSocket } = vi.hoisted(() => ({
  mockUseSession: vi.fn(),
  mockUseSocket: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  useSession: mockUseSession,
}));

vi.mock("@/hooks/use-socket", () => ({
  useSocket: mockUseSocket,
}));

vi.mock("@/components/ui/toast/toast-provider", () => ({
  ToastProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("./quota-banner", () => ({
  QuotaBanner: () => null,
}));

vi.mock("./sidebar", () => ({
  Sidebar: ({ user }: { user: { name: string; email: string } }) => (
    <div data-testid="sidebar">
      <span data-testid="sidebar-user">{user?.name}</span>
    </div>
  ),
}));

vi.mock("@/features/recording/recording-modal", () => ({
  RecordingModal: () => <div data-testid="recording-modal" />,
}));

const defaultProps = {
  user: { name: "Jane Doe", email: "jane@example.com" },
};

describe("DashboardContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSession.mockReturnValue({
      data: { accessToken: "jwt-123" },
      status: "authenticated",
    });
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

  it("invokes useSocket with the session accessToken", () => {
    render(
      <DashboardContent {...defaultProps}>
        <div>Content</div>
      </DashboardContent>,
    );
    expect(mockUseSocket).toHaveBeenCalledWith({ token: "jwt-123" });
  });

  it("invokes useSocket with null when there is no session", () => {
    mockUseSession.mockReturnValue({ data: null, status: "unauthenticated" });
    render(
      <DashboardContent {...defaultProps}>
        <div>Content</div>
      </DashboardContent>,
    );
    expect(mockUseSocket).toHaveBeenCalledWith({ token: null });
  });

  it("mounts the global RecordingModal", () => {
    render(
      <DashboardContent {...defaultProps}>
        <div>Content</div>
      </DashboardContent>,
    );
    expect(screen.getByTestId("recording-modal")).toBeInTheDocument();
  });
});
