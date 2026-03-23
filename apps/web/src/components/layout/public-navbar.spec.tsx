import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { PublicNavbar } from "./public-navbar";

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("PublicNavbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render Yappie logo link", () => {
    render(<PublicNavbar />);

    const logo = screen.getByText("Yappie");
    expect(logo).toBeInTheDocument();
    expect(logo.closest("a")).toHaveAttribute("href", "/");
  });

  it("should show login and register links when not authenticated", () => {
    render(<PublicNavbar />);

    const loginLink = screen.getByText("Log in");
    expect(loginLink).toBeInTheDocument();
    expect(loginLink.closest("a")).toHaveAttribute("href", "/login");

    const registerLink = screen.getByText("Get Started");
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest("a")).toHaveAttribute("href", "/register");
  });

  it("should show dashboard link when authenticated", () => {
    render(<PublicNavbar isAuthenticated={true} />);

    const dashboardLink = screen.getByText("Go to Dashboard");
    expect(dashboardLink).toBeInTheDocument();
    expect(dashboardLink.closest("a")).toHaveAttribute("href", "/dashboard/audios");
  });

  it("should not show login/register when authenticated", () => {
    render(<PublicNavbar isAuthenticated={true} />);

    expect(screen.queryByText("Log in")).not.toBeInTheDocument();
    expect(screen.queryByText("Get Started")).not.toBeInTheDocument();
  });

  it("should not show dashboard when not authenticated", () => {
    render(<PublicNavbar />);

    expect(screen.queryByText("Go to Dashboard")).not.toBeInTheDocument();
  });
});
