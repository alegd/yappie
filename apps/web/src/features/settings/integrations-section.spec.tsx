import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { IntegrationsSection } from "./integrations-section";

const { mockApiFetcher, mockInvalidateQuery, mockUseQuery } = vi.hoisted(() => ({
  mockApiFetcher: vi.fn(),
  mockInvalidateQuery: vi.fn(),
  mockUseQuery: vi.fn(),
}));

vi.mock("@/lib/api-fetcher", () => ({
  apiFetcher: mockApiFetcher,
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: mockInvalidateQuery,
}));

describe("IntegrationsSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when disconnected", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: { connected: false, siteName: null, connectedAt: null },
      });
    });

    it("should render the Integrations heading", () => {
      render(<IntegrationsSection />);

      expect(screen.getByRole("heading", { name: "Integrations" })).toBeInTheDocument();
    });

    it("should show Connect Jira button", () => {
      render(<IntegrationsSection />);

      expect(screen.getByRole("button", { name: /connect jira/i })).toBeInTheDocument();
    });

    it("should not show Disconnect button", () => {
      render(<IntegrationsSection />);

      expect(screen.queryByRole("button", { name: /disconnect/i })).not.toBeInTheDocument();
    });

    it("should redirect to Jira auth URL when Connect Jira is clicked", async () => {
      const user = userEvent.setup();
      const originalLocation = window.location;
      Object.defineProperty(window, "location", {
        writable: true,
        value: { href: "" },
      });

      mockApiFetcher.mockResolvedValue({ url: "https://jira.example.com/auth" });
      render(<IntegrationsSection />);

      await user.click(screen.getByRole("button", { name: /connect jira/i }));

      await waitFor(() => {
        expect(mockApiFetcher).toHaveBeenCalledWith("/v1/integrations/jira/auth");
        expect(window.location.href).toBe("https://jira.example.com/auth");
      });

      Object.defineProperty(window, "location", { writable: true, value: originalLocation });
    });
  });

  describe("when connected", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({
        data: { connected: true, siteName: "my-company", connectedAt: "2024-01-01" },
      });
    });

    it("should show connected site name", () => {
      render(<IntegrationsSection />);

      expect(screen.getByText(/connected to my-company/i)).toBeInTheDocument();
    });

    it("should show Disconnect button", () => {
      render(<IntegrationsSection />);

      expect(screen.getByRole("button", { name: /disconnect/i })).toBeInTheDocument();
    });

    it("should not show Connect Jira button", () => {
      render(<IntegrationsSection />);

      expect(screen.queryByRole("button", { name: /^connect jira$/i })).not.toBeInTheDocument();
    });

    it("should disconnect when confirmed", async () => {
      const user = userEvent.setup();
      vi.spyOn(window, "confirm").mockReturnValue(true);
      mockApiFetcher.mockResolvedValue({});
      render(<IntegrationsSection />);

      await user.click(screen.getByRole("button", { name: /disconnect/i }));

      await waitFor(() => {
        expect(mockApiFetcher).toHaveBeenCalledWith("/v1/integrations/jira", { method: "DELETE" });
        expect(mockInvalidateQuery).toHaveBeenCalledWith("/v1/integrations/jira/status");
      });
    });

    it("should not disconnect when confirm is cancelled", async () => {
      const user = userEvent.setup();
      vi.spyOn(window, "confirm").mockReturnValue(false);
      render(<IntegrationsSection />);

      await user.click(screen.getByRole("button", { name: /disconnect/i }));

      expect(mockApiFetcher).not.toHaveBeenCalled();
      expect(mockInvalidateQuery).not.toHaveBeenCalled();
    });

    it("should show Atlassian fallback when siteName is null", () => {
      mockUseQuery.mockReturnValue({
        data: { connected: true, siteName: null, connectedAt: "2024-01-01" },
      });
      render(<IntegrationsSection />);

      expect(screen.getByText(/connected to atlassian/i)).toBeInTheDocument();
    });
  });

  describe("when data is not yet loaded", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({ data: undefined });
    });

    it("should show Connect Jira button by default", () => {
      render(<IntegrationsSection />);

      expect(screen.getByRole("button", { name: /connect jira/i })).toBeInTheDocument();
    });
  });
});
