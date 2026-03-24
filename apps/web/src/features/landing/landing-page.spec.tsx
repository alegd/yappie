import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

  it("should render 'Powered by OpenAI' badge", () => {
    render(<LandingPage />);

    expect(screen.getByText("Powered by OpenAI")).toBeInTheDocument();
  });

  it("should render CTA links pointing to /register", () => {
    render(<LandingPage />);

    const ctaLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("href") === "/register");

    expect(ctaLinks).toHaveLength(2);
    expect(screen.getByText("Start for free")).toBeInTheDocument();
    expect(screen.getByText("Get started for free")).toBeInTheDocument();
  });

  it("should render all three feature cards", () => {
    render(<LandingPage />);

    expect(screen.getByText("Record or Upload")).toBeInTheDocument();
    expect(screen.getByText("AI Decomposes Tasks")).toBeInTheDocument();
    expect(screen.getByText("Export to Jira")).toBeInTheDocument();
  });

  it("should render how-it-works section with 4 steps", () => {
    render(<LandingPage />);

    expect(screen.getByRole("heading", { name: "How it works" })).toBeInTheDocument();
    expect(screen.getByText("Record a voice note or upload an audio file")).toBeInTheDocument();
    expect(screen.getByText("AI transcribes and extracts actionable tasks")).toBeInTheDocument();
    expect(screen.getByText("Review and edit generated tickets")).toBeInTheDocument();
    expect(screen.getByText("Export to Jira with one click")).toBeInTheDocument();
  });

  it("should render footer with project name and license", () => {
    render(<LandingPage />);

    expect(screen.getByText("Yappie — TFM Project")).toBeInTheDocument();
    expect(screen.getByText("AGPL-3.0")).toBeInTheDocument();
  });

  it("should render PublicNavbar", () => {
    render(<LandingPage />);

    expect(screen.getByTestId("public-navbar")).toBeInTheDocument();
  });
});
