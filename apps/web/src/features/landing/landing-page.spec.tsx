import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LandingPage } from "./landing-page";

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

  it("should render decorative audio wave bars behind the hero (aria-hidden)", () => {
    const { container } = render(<LandingPage />);

    const waves = container.querySelector('[data-testid="hero-waves"]');
    expect(waves).not.toBeNull();
    expect(waves).toHaveAttribute("aria-hidden", "true");
    expect(waves?.children.length).toBe(20);
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

  it("should render decorative numbers 1, 2, 3 on the step cards", () => {
    const { container } = render(<LandingPage />);

    const decorativeNumbers = container.querySelectorAll('[data-testid="step-number"]');
    expect(decorativeNumbers.length).toBe(3);
    expect(decorativeNumbers[0].textContent).toBe("1");
    expect(decorativeNumbers[1].textContent).toBe("2");
    expect(decorativeNumbers[2].textContent).toBe("3");
    decorativeNumbers.forEach((n) => {
      expect(n).toHaveAttribute("aria-hidden", "true");
    });
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

    expect(
      screen.getByRole("heading", { name: /Your AI knows.*your project/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("Without context")).toBeInTheDocument();
    expect(screen.getByText("With project context")).toBeInTheDocument();
    expect(screen.getByText("[Bug] Login problem in Safari")).toBeInTheDocument();
    expect(screen.getByText("[Bug] Login: form broken in Safari")).toBeInTheDocument();
  });

  it("should render AI-enhanced badge on the with-context card", () => {
    render(<LandingPage />);

    expect(screen.getByText("AI-enhanced")).toBeInTheDocument();
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

    expect(screen.getByRole("heading", { name: /Simple.*pricing/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Free", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Pro", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("$0")).toBeInTheDocument();
    expect(screen.getByText("$4.99")).toBeInTheDocument();
  });

  it("should render RECOMMENDED badge on the Pro plan", () => {
    render(<LandingPage />);

    expect(screen.getByText("RECOMMENDED")).toBeInTheDocument();
  });

  it("should render checkmark icons for each pricing feature", () => {
    const { container } = render(<LandingPage />);

    const checks = container.querySelectorAll('[data-testid="pricing-check"]');
    // 4 features × 2 plans
    expect(checks.length).toBe(8);
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

  it("should render footer trust line with TDD and test counts", () => {
    render(<LandingPage />);

    expect(screen.getByText(/Built with TDD/i)).toBeInTheDocument();
  });
});
