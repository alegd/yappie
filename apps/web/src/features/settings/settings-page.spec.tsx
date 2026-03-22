import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettingsPage } from "./settings-page";

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: vi.fn(),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render integrations section", async () => {
    // 1st call: templates, 2nd call: jiraStatus
    mockUseQuery
      .mockReturnValueOnce({ data: [], error: undefined, isLoading: false, mutate: vi.fn() })
      .mockReturnValueOnce({
        data: undefined,
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
      });
    render(<SettingsPage />);
    expect(await screen.findByText(/integrations/i)).toBeInTheDocument();
  });

  it("should render templates section", async () => {
    mockUseQuery
      .mockReturnValueOnce({ data: [], error: undefined, isLoading: false, mutate: vi.fn() })
      .mockReturnValueOnce({
        data: undefined,
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
      });
    render(<SettingsPage />);
    const headings = await screen.findAllByText(/templates/i);
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("should show Jira connect button when not connected", async () => {
    mockUseQuery
      .mockReturnValueOnce({ data: [], error: undefined, isLoading: false, mutate: vi.fn() })
      .mockReturnValueOnce({
        data: undefined,
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
      });
    render(<SettingsPage />);
    expect(await screen.findByText(/connect jira/i)).toBeInTheDocument();
  });

  it("should display templates list", async () => {
    mockUseQuery
      .mockReturnValueOnce({
        data: [
          { id: "tpl-1", name: "Bug Report", isDefault: true },
          { id: "tpl-2", name: "Feature Request", isDefault: false },
        ],
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
      })
      .mockReturnValueOnce({
        data: undefined,
        error: undefined,
        isLoading: false,
        mutate: vi.fn(),
      });

    render(<SettingsPage />);
    expect(await screen.findByText("Bug Report")).toBeInTheDocument();
    expect(screen.getByText("Feature Request")).toBeInTheDocument();
  });
});
