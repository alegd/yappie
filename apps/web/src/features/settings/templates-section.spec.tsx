import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TemplatesSection } from "./templates-section";

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

vi.mock("./template-form", () => ({
  TemplateForm: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="template-form">
      <button onClick={onClose}>Close form</button>
    </div>
  ),
}));

const mockTemplates = [
  { id: "t-1", name: "Bug Report", content: "## Steps to reproduce", isDefault: true },
  { id: "t-2", name: "Feature Request", content: "## Description", isDefault: false },
];

describe("TemplatesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when there are no templates", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({ data: [] });
    });

    it("should render the Templates heading", () => {
      render(<TemplatesSection />);

      expect(screen.getByRole("heading", { name: "Templates" })).toBeInTheDocument();
    });

    it("should show empty state message", () => {
      render(<TemplatesSection />);

      expect(screen.getByText("No templates yet.")).toBeInTheDocument();
    });

    it("should show New template button", () => {
      render(<TemplatesSection />);

      expect(screen.getByRole("button", { name: /new template/i })).toBeInTheDocument();
    });

    it("should open TemplateForm when New template is clicked", async () => {
      const user = userEvent.setup();
      render(<TemplatesSection />);

      await user.click(screen.getByRole("button", { name: /new template/i }));

      expect(screen.getByTestId("template-form")).toBeInTheDocument();
    });

    it("should hide New template button while form is open", async () => {
      const user = userEvent.setup();
      render(<TemplatesSection />);

      await user.click(screen.getByRole("button", { name: /new template/i }));

      expect(screen.queryByRole("button", { name: /new template/i })).not.toBeInTheDocument();
    });

    it("should close form when TemplateForm calls onClose", async () => {
      const user = userEvent.setup();
      render(<TemplatesSection />);

      await user.click(screen.getByRole("button", { name: /new template/i }));
      await user.click(screen.getByRole("button", { name: /close form/i }));

      expect(screen.queryByTestId("template-form")).not.toBeInTheDocument();
    });
  });

  describe("when there are templates", () => {
    beforeEach(() => {
      mockUseQuery.mockReturnValue({ data: mockTemplates });
    });

    it("should render all template names", () => {
      render(<TemplatesSection />);

      expect(screen.getByText("Bug Report")).toBeInTheDocument();
      expect(screen.getByText("Feature Request")).toBeInTheDocument();
    });

    it("should show Default badge only for default templates", () => {
      render(<TemplatesSection />);

      const defaultBadges = screen.getAllByText("Default");
      expect(defaultBadges).toHaveLength(1);
    });

    it("should render edit button for each template", () => {
      render(<TemplatesSection />);

      expect(screen.getByRole("button", { name: /edit bug report/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /edit feature request/i })).toBeInTheDocument();
    });

    it("should render delete button for each template", () => {
      render(<TemplatesSection />);

      expect(screen.getByRole("button", { name: /delete bug report/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /delete feature request/i })).toBeInTheDocument();
    });

    it("should open TemplateForm with template data when edit is clicked", async () => {
      const user = userEvent.setup();
      render(<TemplatesSection />);

      await user.click(screen.getByRole("button", { name: /edit bug report/i }));

      expect(screen.getByTestId("template-form")).toBeInTheDocument();
    });

    it("should delete template when confirmed", async () => {
      const user = userEvent.setup();
      vi.spyOn(window, "confirm").mockReturnValue(true);
      mockApiFetcher.mockResolvedValue({});
      render(<TemplatesSection />);

      await user.click(screen.getByRole("button", { name: /delete bug report/i }));

      await waitFor(() => {
        expect(mockApiFetcher).toHaveBeenCalledWith("/v1/templates/t-1", { method: "DELETE" });
        expect(mockInvalidateQuery).toHaveBeenCalledWith("/v1/templates");
      });
    });

    it("should not delete template when confirm is cancelled", async () => {
      const user = userEvent.setup();
      vi.spyOn(window, "confirm").mockReturnValue(false);
      render(<TemplatesSection />);

      await user.click(screen.getByRole("button", { name: /delete bug report/i }));

      expect(mockApiFetcher).not.toHaveBeenCalled();
      expect(mockInvalidateQuery).not.toHaveBeenCalled();
    });

    it("should not show empty state when templates exist", () => {
      render(<TemplatesSection />);

      expect(screen.queryByText("No templates yet.")).not.toBeInTheDocument();
    });
  });
});
