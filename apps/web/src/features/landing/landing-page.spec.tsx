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

  it("should render hero title", () => {
    render(<LandingPage />);

    expect(screen.getByText("Turn voice notes into")).toBeInTheDocument();
    expect(screen.getByText("Jira tickets")).toBeInTheDocument();
  });

  it("should render 'Powered by AI' badge", () => {
    render(<LandingPage />);

    expect(screen.getByText("Powered by AI")).toBeInTheDocument();
  });

  it("should render CTA links pointing to /auth", () => {
    render(<LandingPage />);

    const ctaLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/auth");

    expect(ctaLinks).toHaveLength(2);
    expect(screen.getByText("Start for free")).toBeInTheDocument();
    expect(screen.getByText("Get started for free")).toBeInTheDocument();
  });

  it("should render all three feature cards", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "Record or Upload", level: 3 })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "AI Decomposes Tasks", level: 3 }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Export to Jira", level: 3 })).toBeInTheDocument();
  });

  it("should render how-it-works section with 4 steps", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "How it works" })).toBeInTheDocument();
    expect(screen.getAllByText("Record or upload")).toHaveLength(1);
    expect(screen.getByText("AI extracts tasks")).toBeInTheDocument();
    expect(screen.getByText("Review and edit")).toBeInTheDocument();
    // "Export to Jira" appears in both features (h3) and steps (p)
    expect(screen.getAllByText("Export to Jira")).toHaveLength(2);
  });

  it("should render footer with project name and license", () => {
    render(<LandingPage />);

    expect(screen.getByText("Yappie")).toBeInTheDocument();
    expect(screen.getByText("AGPL-3.0")).toBeInTheDocument();
  });

  it("should render PublicNavbar", () => {
    render(<LandingPage />);

    expect(screen.getByTestId("public-navbar")).toBeInTheDocument();
  });
});
