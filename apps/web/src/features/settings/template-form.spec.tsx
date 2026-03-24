import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TemplateForm } from "./template-form";

const { mockApiFetcher, mockInvalidateQuery } = vi.hoisted(() => ({
  mockApiFetcher: vi.fn(),
  mockInvalidateQuery: vi.fn(),
}));

vi.mock("@/lib/api-fetcher", () => ({
  apiFetcher: mockApiFetcher,
}));

vi.mock("@/hooks/use-query", () => ({
  invalidateQuery: mockInvalidateQuery,
}));

describe("TemplateForm", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render create form with empty fields", () => {
    render(<TemplateForm onClose={mockOnClose} />);

    expect(screen.getByText("New template")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("");
    expect(screen.getByLabelText("Content")).toHaveValue("");
  });

  it("should render edit form with pre-filled fields", () => {
    const template = { id: "t-1", name: "Bug Report", content: "## Steps", isDefault: true };
    render(<TemplateForm template={template} onClose={mockOnClose} />);

    expect(screen.getByText("Edit template")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Bug Report");
    expect(screen.getByLabelText("Content")).toHaveValue("## Steps");
  });

  it("should call apiFetcher with POST on create submit", async () => {
    const user = userEvent.setup();
    mockApiFetcher.mockResolvedValue({});
    render(<TemplateForm onClose={mockOnClose} />);

    await user.type(screen.getByLabelText("Name"), "Bug Report");
    await user.type(screen.getByLabelText("Content"), "## Description");
    await user.click(screen.getByRole("button", { name: /create template/i }));

    await waitFor(() => {
      expect(mockApiFetcher).toHaveBeenCalledWith("/v1/templates", {
        data: {
          name: "Bug Report",
          content: "## Description",
          isDefault: false,
        },
        method: "POST",
      });
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should call apiFetcher with PATCH on edit submit", async () => {
    const user = userEvent.setup();
    mockApiFetcher.mockResolvedValue({});
    const template = { id: "t-1", name: "Bug Report", content: "## Steps", isDefault: false };
    render(<TemplateForm template={template} onClose={mockOnClose} />);

    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Updated Name");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(mockApiFetcher).toHaveBeenCalledWith("/v1/templates/t-1", {
        data: {
          name: "Updated Name",
          content: "## Steps",
          isDefault: false,
        },
        method: "PATCH",
      });
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should call onClose when Cancel clicked", async () => {
    const user = userEvent.setup();
    render(<TemplateForm onClose={mockOnClose} />);

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should call onClose when X clicked", async () => {
    const user = userEvent.setup();
    render(<TemplateForm onClose={mockOnClose} />);

    await user.click(screen.getByRole("button", { name: /close form/i }));

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should show error when save fails", async () => {
    const user = userEvent.setup();
    mockApiFetcher.mockRejectedValue(new Error("Server error"));
    render(<TemplateForm onClose={mockOnClose} />);

    await user.type(screen.getByLabelText("Name"), "Test");
    await user.type(screen.getByLabelText("Content"), "Content");
    await user.click(screen.getByRole("button", { name: /create template/i }));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
