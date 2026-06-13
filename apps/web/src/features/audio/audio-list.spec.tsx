import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AudioList } from "./audio-list";

const { mockUseQuery, mockInvalidateQuery, mockApiFetcher, mockToastError } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockInvalidateQuery: vi.fn(),
  mockApiFetcher: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: mockInvalidateQuery,
}));

vi.mock("@/lib/api-fetcher", () => ({
  apiFetcher: mockApiFetcher,
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  toast: {
    success: vi.fn(),
    error: mockToastError,
    info: vi.fn(),
  },
}));

vi.mock("@/components/ui/app-select", () => ({
  AppSelect: ({
    value,
    onChange,
    options,
    ariaLabel,
    placeholder,
  }: {
    value: string;
    onChange: (v: string) => void;
    options: Array<{ value: string; label: string }>;
    ariaLabel?: string;
    placeholder?: string;
  }) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={ariaLabel}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("./audio-upload", () => ({
  AudioUpload: () => <div data-testid="audio-upload" />,
}));

vi.mock("./onboarding-checklist", () => ({
  OnboardingChecklist: ({ hasProjects }: { hasProjects: boolean }) => (
    <div data-testid="onboarding-checklist" data-has-projects={hasProjects} />
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockAudioData = {
  data: [
    {
      id: "a-1",
      fileName: "standup.mp3",
      fileSize: 1048576,
      mimeType: "audio/mpeg",
      status: "COMPLETED",
      createdAt: "2026-03-21T10:00:00.000Z",
    },
    {
      id: "a-2",
      fileName: "planning.mp3",
      fileSize: 2097152,
      mimeType: "audio/mpeg",
      status: "PENDING",
      createdAt: "2026-03-21T11:00:00.000Z",
    },
  ],
  total: 2,
  page: 1,
  limit: 50,
};

const mockProjectData = {
  data: [{ id: "p-1", name: "Project Alpha" }],
  total: 1,
  page: 1,
  limit: 50,
};

const mockJiraConnected = { connected: true, siteName: "mysite", connectedAt: "2026-03-21" };
const mockJiraDisconnected = { connected: false, siteName: null, connectedAt: null };

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

const queryResult = (data: unknown, isLoading = false, error?: Error) => ({
  data,
  error,
  isLoading,
  mutate: vi.fn(),
});

// useQuery is called in this order: audioKey, PROJECTS_LIST, JIRA_STATUS
function mockQueries(
  audioData: unknown,
  projectData: unknown,
  jiraData: unknown,
  isLoading = false,
) {
  mockUseQuery
    .mockReturnValueOnce(queryResult(audioData, isLoading))
    .mockReturnValueOnce(queryResult(projectData))
    .mockReturnValueOnce(queryResult(jiraData));
}

describe("AudioList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReset();
    mockLocalStorage.clear();
    Object.defineProperty(globalThis, "localStorage", {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  it("should show loading state", () => {
    mockQueries(undefined, undefined, undefined, true);

    render(<AudioList />);

    expect(screen.queryByText("Audios")).not.toBeInTheDocument();
  });

  it("should display audio list after loading", () => {
    mockQueries(mockAudioData, mockProjectData, mockJiraConnected);

    render(<AudioList />);

    expect(screen.getByText("standup.mp3")).toBeInTheDocument();
    expect(screen.getByText("planning.mp3")).toBeInTheDocument();
  });

  it("should show empty state when no audios but has projects", () => {
    const emptyData = { data: [], total: 0, page: 1, limit: 50 };
    mockQueries(emptyData, mockProjectData, mockJiraConnected);

    render(<AudioList />);

    expect(screen.getByText("No audio recordings yet.")).toBeInTheDocument();
  });

  it("should show onboarding checklist when no projects", () => {
    const emptyData = { data: [], total: 0, page: 1, limit: 50 };
    const emptyProjects = { data: [], total: 0, page: 1, limit: 50 };
    mockQueries(emptyData, emptyProjects, mockJiraDisconnected);

    render(<AudioList />);

    expect(screen.getByTestId("onboarding-checklist")).toBeInTheDocument();
    expect(screen.queryByTestId("audio-upload")).not.toBeInTheDocument();
  });

  it("should render audio items as links to detail page", () => {
    mockQueries(mockAudioData, mockProjectData, mockJiraConnected);

    render(<AudioList />);

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/dashboard/audio/a-1");
    expect(links[1]).toHaveAttribute("href", "/dashboard/audio/a-2");
  });

  it("should show project filter dropdown", () => {
    mockQueries(mockAudioData, mockProjectData, mockJiraConnected);

    render(<AudioList />);

    const select = screen.getByLabelText("Filter by project");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("All projects")).toBeInTheDocument();
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
  });

  it("should render AudioUpload component", () => {
    mockQueries(mockAudioData, mockProjectData, mockJiraConnected);

    render(<AudioList />);

    expect(screen.getByTestId("audio-upload")).toBeInTheDocument();
  });

  it("should display formatted file sizes", () => {
    mockQueries(mockAudioData, mockProjectData, mockJiraConnected);

    render(<AudioList />);

    expect(screen.getByText(/1\.0 MB/)).toBeInTheDocument();
    expect(screen.getByText(/2\.0 MB/)).toBeInTheDocument();
  });

  it("should display status badges", () => {
    mockQueries(mockAudioData, mockProjectData, mockJiraConnected);

    render(<AudioList />);

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("should filter by project when selected", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();

    mockQueries(mockAudioData, mockProjectData, mockJiraConnected);
    render(<AudioList />);

    const select = screen.getByLabelText("Filter by project");

    // Re-mock for re-render after selection
    mockQueries(mockAudioData, mockProjectData, mockJiraConnected);

    await user.selectOptions(select, "p-1");

    expect(select).toHaveValue("p-1");
  });

  it("should format small file sizes in KB", () => {
    const smallFileData = {
      data: [
        {
          id: "a-3",
          fileName: "tiny.mp3",
          fileSize: 512,
          mimeType: "audio/mpeg",
          status: "COMPLETED" as const,
          createdAt: "2026-03-21T10:00:00.000Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 50,
    };

    mockQueries(smallFileData, mockProjectData, mockJiraConnected);

    render(<AudioList />);

    expect(screen.getByText(/512 B/)).toBeInTheDocument();
  });

  it("should show Jira banner when projects exist but Jira not connected", () => {
    mockQueries(mockAudioData, mockProjectData, mockJiraDisconnected);

    render(<AudioList />);

    expect(screen.getByText(/Connect Jira to export your tickets/)).toBeInTheDocument();
    expect(screen.getByText("Go to Settings")).toBeInTheDocument();
  });

  it("should not show Jira banner when Jira is connected", () => {
    mockQueries(mockAudioData, mockProjectData, mockJiraConnected);

    render(<AudioList />);

    expect(screen.queryByText(/Connect Jira to export your tickets/)).not.toBeInTheDocument();
  });

  describe("delete", () => {
    it("should render a delete button per audio row", () => {
      mockQueries(mockAudioData, mockProjectData, mockJiraConnected);

      render(<AudioList />);

      const deleteButtons = screen.getAllByLabelText(/delete audio/i);
      expect(deleteButtons.length).toBe(2);
    });

    it("should call the delete endpoint and invalidate the list on confirm", async () => {
      const user = (await import("@testing-library/user-event")).default.setup();
      vi.spyOn(window, "confirm").mockReturnValue(true);
      mockApiFetcher.mockResolvedValue(undefined);
      mockQueries(mockAudioData, mockProjectData, mockJiraConnected);

      render(<AudioList />);

      await user.click(screen.getAllByLabelText(/delete audio/i)[0]);

      expect(mockApiFetcher).toHaveBeenCalledWith("/v1/audio/a-1", { method: "DELETE" });
      expect(mockInvalidateQuery).toHaveBeenCalled();
    });

    it("should not delete when confirm is cancelled", async () => {
      const user = (await import("@testing-library/user-event")).default.setup();
      vi.spyOn(window, "confirm").mockReturnValue(false);
      mockQueries(mockAudioData, mockProjectData, mockJiraConnected);

      render(<AudioList />);

      await user.click(screen.getAllByLabelText(/delete audio/i)[0]);

      expect(mockApiFetcher).not.toHaveBeenCalled();
      expect(mockInvalidateQuery).not.toHaveBeenCalled();
    });

    it("should show a toast error when delete fails", async () => {
      const user = (await import("@testing-library/user-event")).default.setup();
      vi.spyOn(window, "confirm").mockReturnValue(true);
      mockApiFetcher.mockRejectedValue(new Error("Server error"));
      mockQueries(mockAudioData, mockProjectData, mockJiraConnected);

      render(<AudioList />);

      await user.click(screen.getAllByLabelText(/delete audio/i)[0]);

      await new Promise((r) => setTimeout(r, 0));

      expect(mockToastError).toHaveBeenCalledWith("Server error");
    });
  });

  it("should dismiss Jira banner and persist in localStorage", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();

    mockQueries(mockAudioData, mockProjectData, mockJiraDisconnected);
    render(<AudioList />);

    expect(screen.getByText(/Connect Jira to export your tickets/)).toBeInTheDocument();

    const dismissButton = screen.getByLabelText("Dismiss Jira banner");

    mockQueries(mockAudioData, mockProjectData, mockJiraDisconnected);
    await user.click(dismissButton);

    expect(screen.queryByText(/Connect Jira to export your tickets/)).not.toBeInTheDocument();
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith("yappie:jira-banner-dismissed", "true");
  });
});
