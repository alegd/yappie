import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingChecklist } from "./onboarding-checklist";

const { mockApiFetcher, mockToastError } = vi.hoisted(() => ({
  mockApiFetcher: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("@/lib/api-fetcher", () => ({
  apiFetcher: mockApiFetcher,
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  toast: {
    error: mockToastError,
    success: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("OnboardingChecklist", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render all 3 checklist items", () => {
    render(<OnboardingChecklist jiraConnected={false} hasProjects={false} />);

    expect(screen.getAllByText("Connect Jira").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Create a project")).toBeInTheDocument();
    expect(screen.getByText("Upload your first audio")).toBeInTheDocument();
  });

  describe("Jira connection step", () => {
    it("should show Connect Jira button when not connected", () => {
      render(<OnboardingChecklist jiraConnected={false} hasProjects={false} />);

      expect(screen.getByRole("button", { name: /connect jira/i })).toBeInTheDocument();
    });

    it("should show connected state with site name when Jira is connected", () => {
      render(
        <OnboardingChecklist jiraConnected={true} jiraSiteName="my-company" hasProjects={false} />,
      );

      expect(screen.getByText(/connected to my-company/i)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /connect jira/i })).not.toBeInTheDocument();
    });

    it("should show Atlassian fallback when connected but no site name provided", () => {
      render(<OnboardingChecklist jiraConnected={true} hasProjects={false} />);

      expect(screen.getByText(/connected to atlassian/i)).toBeInTheDocument();
    });
  });

  describe("Projects step", () => {
    it("should show Create project link when no projects", () => {
      render(<OnboardingChecklist jiraConnected={false} hasProjects={false} />);

      expect(screen.getByRole("link", { name: /create project/i })).toBeInTheDocument();
    });

    it("should show checked state when has projects", () => {
      render(<OnboardingChecklist jiraConnected={false} hasProjects={true} />);

      expect(screen.queryByRole("button", { name: /create project/i })).not.toBeInTheDocument();
    });
  });

  describe("Upload step", () => {
    it("should show upload step as disabled when no projects", () => {
      render(<OnboardingChecklist jiraConnected={false} hasProjects={false} />);

      const uploadText = screen.getByText("Upload your first audio");
      expect(uploadText).toHaveClass("text-muted-foreground/40");
    });

    it("should show upload step as active when has projects", () => {
      render(<OnboardingChecklist jiraConnected={false} hasProjects={true} />);

      const uploadText = screen.getByText("Upload your first audio");
      expect(uploadText).not.toHaveClass("text-muted-foreground/40");
    });
  });

  describe("handleConnectJira", () => {
    it("should call apiFetcher with returnPath when Connect Jira is clicked", async () => {
      const user = userEvent.setup();
      const originalLocation = window.location;
      Object.defineProperty(window, "location", {
        writable: true,
        value: { href: "" },
      });

      mockApiFetcher.mockResolvedValue({ url: "https://jira.example.com/oauth" });

      render(<OnboardingChecklist jiraConnected={false} hasProjects={false} />);

      await user.click(screen.getByRole("button", { name: /connect jira/i }));

      await waitFor(() => {
        expect(mockApiFetcher).toHaveBeenCalledWith(
          "/v1/integrations/jira/auth?returnPath=/dashboard",
        );
        expect(window.location.href).toBe("https://jira.example.com/oauth");
      });

      Object.defineProperty(window, "location", { writable: true, value: originalLocation });
    });

    it("should show toast error when Connect Jira request fails with Error", async () => {
      const user = userEvent.setup();
      mockApiFetcher.mockRejectedValue(new Error("Auth service unavailable"));

      render(<OnboardingChecklist jiraConnected={false} hasProjects={false} />);

      await user.click(screen.getByRole("button", { name: /connect jira/i }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Auth service unavailable");
      });
    });

    it("should show generic toast error when Connect Jira throws non-Error", async () => {
      const user = userEvent.setup();
      mockApiFetcher.mockRejectedValue("unexpected failure");

      render(<OnboardingChecklist jiraConnected={false} hasProjects={false} />);

      await user.click(screen.getByRole("button", { name: /connect jira/i }));

      await waitFor(() => {
        expect(mockToastError).toHaveBeenCalledWith("Something went wrong");
      });
    });
  });
});
