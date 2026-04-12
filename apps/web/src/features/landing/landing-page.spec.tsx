import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LandingPage } from "./landing-page";

vi.mock("@/components/layout/public-navbar", () => ({
  PublicNavbar: () => <nav data-testid="public-navbar" />,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("LandingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render hero with new headline", () => {
    render(<LandingPage />);

    expect(screen.getByText("Talk. Yappie writes")).toBeInTheDocument();
    expect(screen.getByText("the ticket.")).toBeInTheDocument();
  });

  it("should render combined badge", () => {
    render(<LandingPage />);

    expect(screen.getByText(/Open Source/)).toBeInTheDocument();
    expect(screen.getByText(/Powered by AI/)).toBeInTheDocument();
  });

  it("should render trust badges below CTAs", () => {
    render(<LandingPage />);

    expect(screen.getAllByText(/No credit card/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/20 min.month free/).length).toBeGreaterThanOrEqual(1);
  });

  it("should render CTA links pointing to /auth", () => {
    render(<LandingPage />);

    const ctaLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/auth");

    // Hero "Start for free", Free plan CTA, final CTA
    expect(ctaLinks.length).toBeGreaterThanOrEqual(3);
  });

  it("should point Upgrade to Pro to /auth by default", () => {
    render(<LandingPage />);

    const upgradeLink = screen.getByRole("link", { name: /upgrade to pro/i });
    expect(upgradeLink).toHaveAttribute("href", "/auth");
  });

  it("should point Upgrade to Pro to the provided upgradeHref when set", () => {
    render(<LandingPage upgradeHref="/dashboard/settings#billing" />);

    const upgradeLink = screen.getByRole("link", { name: /upgrade to pro/i });
    expect(upgradeLink).toHaveAttribute("href", "/dashboard/settings#billing");
  });

  it("should render 3-step how-it-works section", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", { name: "From audio to action in 3 steps" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Record or upload", level: 3 })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "AI extracts and structures", level: 3 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Review and export", level: 3 }),
    ).toBeInTheDocument();
  });

  it("should render project context differentiator section", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "Your AI knows your project" })).toBeInTheDocument();
    expect(screen.getByText("Without context")).toBeInTheDocument();
    expect(screen.getByText("With project context")).toBeInTheDocument();
    expect(screen.getByText("[Bug] Login problem in Safari")).toBeInTheDocument();
    expect(screen.getByText("[Bug] Login: form broken in Safari")).toBeInTheDocument();
  });

  it("should render features grid with 6 features", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "Built for real teams" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Passwordless auth", level: 3 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Real-time progress", level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Jira OAuth 2.0", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Open source", level: 3 })).toBeInTheDocument();
  });

  it("should render pricing section with Free and Pro plans", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "Simple pricing" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Free", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pro", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.getByText("$4.99")).toBeInTheDocument();
  });

  it("should render final CTA section", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", { name: "Ready to stop typing tickets?" }),
    ).toBeInTheDocument();
  });

  it("should render footer with GitHub, Privacy, and license", () => {
    render(<LandingPage />);

    expect(screen.getByText("Yappie")).toBeInTheDocument();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("Privacy")).toBeInTheDocument();
    expect(screen.getByText("AGPL-3.0")).toBeInTheDocument();
  });

  it("should render PublicNavbar", () => {
    render(<LandingPage />);

    expect(screen.getByTestId("public-navbar")).toBeInTheDocument();
  });
});
