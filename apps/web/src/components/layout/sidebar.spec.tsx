import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "./sidebar";

const { mockUsePathname, mockSignOut } = vi.hoisted(() => ({
  mockUsePathname: vi.fn(),
  mockSignOut: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: mockUsePathname,
}));

vi.mock("next-auth/react", () => ({
  signOut: mockSignOut,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const defaultUser = { name: "John Doe", email: "john@example.com" };

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/dashboard/audios");
  });

  it("should render all navigation items", () => {
    render(<Sidebar user={defaultUser} />);

    expect(screen.getByText("Audios")).toBeInTheDocument();
    expect(screen.getByText("Tickets")).toBeInTheDocument();
    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("should render Yappie logo link pointing to /dashboard/audios", () => {
    render(<Sidebar user={defaultUser} />);

    const logo = screen.getByText("Yappie");
    expect(logo).toBeInTheDocument();
    expect(logo.closest("a")).toHaveAttribute("href", "/dashboard/audios");
  });

  it("should display user name and email", () => {
    render(<Sidebar user={defaultUser} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("should display user initial in avatar", () => {
    render(<Sidebar user={defaultUser} />);

    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("should call signOut when logout button clicked", async () => {
    const user = userEvent.setup();

    render(<Sidebar user={defaultUser} />);

    const logoutButtons = screen.getAllByRole("button");
    const logoutButton = logoutButtons.find((btn) => !btn.getAttribute("aria-label"));
    await user.click(logoutButton!);

    expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });

  it("should have mobile toggle button", () => {
    render(<Sidebar user={defaultUser} />);

    expect(screen.getByRole("button", { name: "Toggle menu" })).toBeInTheDocument();
  });

  it("should toggle mobile menu when toggle button clicked", async () => {
    const user = userEvent.setup();
    render(<Sidebar user={defaultUser} />);

    const toggleButton = screen.getByRole("button", { name: "Toggle menu" });
    await user.click(toggleButton);

    // Overlay should appear
    expect(screen.getByRole("button", { name: "Close menu" })).toBeInTheDocument();
  });

  it("should close mobile menu when overlay clicked", async () => {
    const user = userEvent.setup();
    render(<Sidebar user={defaultUser} />);

    // Open menu
    const toggleButton = screen.getByRole("button", { name: "Toggle menu" });
    await user.click(toggleButton);

    // Click overlay to close
    const overlay = screen.getByRole("button", { name: "Close menu" });
    await user.click(overlay);

    // Overlay should disappear
    expect(screen.queryByRole("button", { name: "Close menu" })).not.toBeInTheDocument();
  });

  it("should highlight active nav item based on pathname", () => {
    mockUsePathname.mockReturnValue("/dashboard/tickets");

    render(<Sidebar user={defaultUser} />);

    const ticketsLink = screen.getByText("Tickets").closest("a");
    expect(ticketsLink).toHaveClass("text-accent");

    const audiosLink = screen.getByText("Audios").closest("a");
    expect(audiosLink).not.toHaveClass("text-accent");
  });
});
