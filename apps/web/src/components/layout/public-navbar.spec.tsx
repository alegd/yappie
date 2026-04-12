import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();

vi.mock("@/config/auth.config", () => ({
  auth: () => mockAuth(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// PublicNavbar is an async Server Component — import after mocks
const { PublicNavbar } = await import("./public-navbar");

describe("PublicNavbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when not authenticated", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue(null);
    });

    it("should render Yappie logo link", async () => {
      render(await PublicNavbar());

      const logo = screen.getByText("Yappie");
      expect(logo).toBeInTheDocument();
      expect(logo.closest("a")).toHaveAttribute("href", "/");
    });

    it("should show Start for free link pointing to /auth", async () => {
      render(await PublicNavbar());

      const ctaLink = screen.getByText("Start for free");
      expect(ctaLink).toBeInTheDocument();
      expect(ctaLink.closest("a")).toHaveAttribute("href", "/auth");
    });

    it("should not show dashboard link", async () => {
      render(await PublicNavbar());

      expect(screen.queryByText("Go to Dashboard")).not.toBeInTheDocument();
    });

    it("should link How it works to the landing section (works from any page)", async () => {
      render(await PublicNavbar());

      const link = screen.getByText("How it works");
      expect(link.closest("a")).toHaveAttribute("href", "/#how-it-works");
    });

    it("should link Pricing to the landing section (works from any page)", async () => {
      render(await PublicNavbar());

      const link = screen.getByText("Pricing");
      expect(link.closest("a")).toHaveAttribute("href", "/#pricing");
    });
  });

  describe("when authenticated", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", name: "Test", email: "test@test.com" } });
    });

    it("should show dashboard link", async () => {
      render(await PublicNavbar());

      const dashboardLink = screen.getByText("Go to Dashboard");
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink.closest("a")).toHaveAttribute("href", "/dashboard/audios");
    });

    it("should not show login/register links", async () => {
      render(await PublicNavbar());

      expect(screen.queryByText("Log in")).not.toBeInTheDocument();
      expect(screen.queryByText("Start for free")).not.toBeInTheDocument();
    });
  });
});
