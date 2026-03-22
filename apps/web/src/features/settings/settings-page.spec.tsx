import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettingsPage } from "./settings-page";

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: mockGet,
    post: vi.fn(),
    delete: vi.fn(),
    setToken: vi.fn(),
  },
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render integrations section", async () => {
    mockGet.mockResolvedValue([]);
    render(<SettingsPage />);
    expect(await screen.findByText(/integrations/i)).toBeInTheDocument();
  });

  it("should render templates section", async () => {
    mockGet.mockResolvedValue([]);
    render(<SettingsPage />);
    const headings = await screen.findAllByText(/templates/i);
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("should show Jira connect button when not connected", async () => {
    mockGet.mockResolvedValue([]);
    render(<SettingsPage />);
    expect(await screen.findByText(/connect jira/i)).toBeInTheDocument();
  });

  it("should display templates list", async () => {
    mockGet.mockImplementation((path: string) => {
      if (path.includes("templates")) {
        return Promise.resolve([
          { id: "tpl-1", name: "Bug Report", isDefault: true },
          { id: "tpl-2", name: "Feature Request", isDefault: false },
        ]);
      }
      return Promise.resolve([]);
    });

    render(<SettingsPage />);
    expect(await screen.findByText("Bug Report")).toBeInTheDocument();
    expect(screen.getByText("Feature Request")).toBeInTheDocument();
  });
});
