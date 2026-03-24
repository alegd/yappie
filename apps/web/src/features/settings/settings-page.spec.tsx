import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPage } from "./settings-page";

const { mockUseQuery, mockInvalidateQuery, mockApiFetcher } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockInvalidateQuery: vi.fn(),
  mockApiFetcher: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: mockInvalidateQuery,
}));

vi.mock("@/lib/api-fetcher", () => ({
  apiFetcher: mockApiFetcher,
}));

vi.mock("@/components/ui/theme-toggle", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock("./template-form", () => ({
  TemplateForm: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="template-form">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

function setupMocks(
  templates: Array<{ id: string; name: string; isDefault: boolean }> = [],
  jiraStatus?: { connected: boolean; siteName: string | null; connectedAt: string | null },
) {
  let callIndex = 0;
  const responses = [
    { data: templates, error: undefined, isLoading: false, mutate: vi.fn() },
    { data: jiraStatus, error: undefined, isLoading: false, mutate: vi.fn() },
  ];
  mockUseQuery.mockImplementation(() => {
    const response = responses[callIndex % 2];
    callIndex++;
    return response;
  });
}

describe("SettingsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render appearance section with theme toggle", async () => {
    setupMocks();
    render(<SettingsPage />);
    expect(await screen.findByText(/appearance/i)).toBeInTheDocument();
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
  });

  it("should render integrations section", async () => {
    setupMocks();
    render(<SettingsPage />);
    expect(await screen.findByText(/integrations/i)).toBeInTheDocument();
  });

  it("should render templates section", async () => {
    setupMocks();
    render(<SettingsPage />);
    const headings = await screen.findAllByText(/templates/i);
    expect(headings.length).toBeGreaterThanOrEqual(1);
  });

  it("should show Jira connect button when not connected", async () => {
    setupMocks();
    render(<SettingsPage />);
    expect(await screen.findByText(/connect jira/i)).toBeInTheDocument();
  });

  it("should show export description when not connected", async () => {
    setupMocks();
    render(<SettingsPage />);
    expect(await screen.findByText(/export tickets to atlassian jira/i)).toBeInTheDocument();
  });

  it("should display templates list", async () => {
    setupMocks([
      { id: "tpl-1", name: "Bug Report", isDefault: true },
      { id: "tpl-2", name: "Feature Request", isDefault: false },
    ]);
    render(<SettingsPage />);
    expect(await screen.findByText("Bug Report")).toBeInTheDocument();
    expect(screen.getByText("Feature Request")).toBeInTheDocument();
  });

  it("should show empty templates state", async () => {
    setupMocks();
    render(<SettingsPage />);
    expect(await screen.findByText(/no templates yet/i)).toBeInTheDocument();
  });

  it("should show connected status with site name when Jira is connected", async () => {
    setupMocks([], {
      connected: true,
      siteName: "my-workspace",
      connectedAt: "2026-03-20T10:00:00Z",
    });
    render(<SettingsPage />);
    expect(await screen.findByText(/connected to my-workspace/i)).toBeInTheDocument();
  });

  it("should show disconnect button when Jira is connected", async () => {
    setupMocks([], {
      connected: true,
      siteName: "my-workspace",
      connectedAt: "2026-03-20T10:00:00Z",
    });
    render(<SettingsPage />);
    expect(await screen.findByText(/disconnect/i)).toBeInTheDocument();
    expect(screen.queryByText(/connect jira/i)).not.toBeInTheDocument();
  });

  it("should call apiFetcher and redirect when Connect Jira is clicked", async () => {
    const user = userEvent.setup();
    setupMocks();
    mockApiFetcher.mockResolvedValue({ url: "https://auth.atlassian.com/authorize?state=abc" });

    const originalLocation = window.location.href;
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...window.location, href: originalLocation },
    });

    render(<SettingsPage />);
    const connectButton = await screen.findByText(/connect jira/i);
    await user.click(connectButton);

    expect(mockApiFetcher).toHaveBeenCalledWith("/v1/integrations/jira/auth");
    expect(window.location.href).toBe("https://auth.atlassian.com/authorize?state=abc");
  });

  it("should call apiFetcher with DELETE when disconnect is confirmed", async () => {
    const user = userEvent.setup();
    setupMocks([], {
      connected: true,
      siteName: "my-workspace",
      connectedAt: "2026-03-20T10:00:00Z",
    });
    mockApiFetcher.mockResolvedValue(undefined);
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<SettingsPage />);
    const disconnectButton = await screen.findByText(/disconnect/i);
    await user.click(disconnectButton);

    expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to disconnect Jira?");
    expect(mockApiFetcher).toHaveBeenCalledWith("/v1/integrations/jira", { method: "DELETE" });
  });

  it("should not disconnect when confirm is cancelled", async () => {
    const user = userEvent.setup();
    setupMocks([], {
      connected: true,
      siteName: "my-workspace",
      connectedAt: "2026-03-20T10:00:00Z",
    });
    vi.spyOn(window, "confirm").mockReturnValue(false);

    render(<SettingsPage />);
    const disconnectButton = await screen.findByText(/disconnect/i);
    await user.click(disconnectButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockApiFetcher).not.toHaveBeenCalled();
  });

  it("should show default badge for default template", async () => {
    setupMocks([
      { id: "tpl-1", name: "Bug Report", isDefault: true },
      { id: "tpl-2", name: "Feature Request", isDefault: false },
    ]);
    render(<SettingsPage />);
    await screen.findByText("Bug Report");
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("should show template form when New button clicked", async () => {
    const user = userEvent.setup();
    setupMocks();
    render(<SettingsPage />);

    await user.click(screen.getByRole("button", { name: /new/i }));

    expect(screen.getByTestId("template-form")).toBeInTheDocument();
  });

  it("should show edit and delete buttons for each template", async () => {
    setupMocks([{ id: "tpl-1", name: "Bug Report", isDefault: false }]);
    render(<SettingsPage />);

    await screen.findByText("Bug Report");
    expect(screen.getByRole("button", { name: /edit bug report/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /delete bug report/i })).toBeInTheDocument();
  });

  it("should call apiFetcher with DELETE when delete template confirmed", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    mockApiFetcher.mockResolvedValue(undefined);

    setupMocks([{ id: "tpl-1", name: "Bug Report", isDefault: false }]);
    render(<SettingsPage />);

    await screen.findByText("Bug Report");
    await user.click(screen.getByRole("button", { name: /delete bug report/i }));

    expect(mockApiFetcher).toHaveBeenCalledWith("/v1/templates/tpl-1", { method: "DELETE" });
  });
});
