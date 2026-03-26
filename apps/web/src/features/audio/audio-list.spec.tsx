import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AudioList } from "./audio-list";

const { mockUseQuery, mockInvalidateQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockInvalidateQuery: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: mockInvalidateQuery,
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

const queryResult = (data: unknown, isLoading = false, error?: Error) => ({
  data,
  error,
  isLoading,
  mutate: vi.fn(),
});

describe("AudioList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state", () => {
    mockUseQuery
      .mockReturnValueOnce(queryResult(undefined, true))
      .mockReturnValueOnce(queryResult(undefined));

    render(<AudioList />);

    expect(screen.queryByText("Audios")).not.toBeInTheDocument();
  });

  it("should display audio list after loading", () => {
    mockUseQuery
      .mockReturnValueOnce(queryResult(mockAudioData))
      .mockReturnValueOnce(queryResult(mockProjectData));

    render(<AudioList />);

    expect(screen.getByText("standup.mp3")).toBeInTheDocument();
    expect(screen.getByText("planning.mp3")).toBeInTheDocument();
  });

  it("should show empty state when no audios", () => {
    const emptyData = { data: [], total: 0, page: 1, limit: 50 };
    mockUseQuery
      .mockReturnValueOnce(queryResult(emptyData))
      .mockReturnValueOnce(queryResult(mockProjectData));

    render(<AudioList />);

    expect(screen.getByText("No audio recordings yet.")).toBeInTheDocument();
  });

  it("should render audio items as links to detail page", () => {
    mockUseQuery
      .mockReturnValueOnce(queryResult(mockAudioData))
      .mockReturnValueOnce(queryResult(mockProjectData));

    render(<AudioList />);

    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "/dashboard/audios/a-1");
    expect(links[1]).toHaveAttribute("href", "/dashboard/audios/a-2");
  });

  it("should show project filter dropdown", () => {
    mockUseQuery
      .mockReturnValueOnce(queryResult(mockAudioData))
      .mockReturnValueOnce(queryResult(mockProjectData));

    render(<AudioList />);

    const select = screen.getByLabelText("Filter by project");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("All projects")).toBeInTheDocument();
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
  });

  it("should render AudioUpload component", () => {
    mockUseQuery
      .mockReturnValueOnce(queryResult(mockAudioData))
      .mockReturnValueOnce(queryResult(mockProjectData));

    render(<AudioList />);

    expect(screen.getByTestId("audio-upload")).toBeInTheDocument();
  });

  it("should display formatted file sizes", () => {
    mockUseQuery
      .mockReturnValueOnce(queryResult(mockAudioData))
      .mockReturnValueOnce(queryResult(mockProjectData));

    render(<AudioList />);

    expect(screen.getByText(/1\.0 MB/)).toBeInTheDocument();
    expect(screen.getByText(/2\.0 MB/)).toBeInTheDocument();
  });

  it("should display status badges", () => {
    mockUseQuery
      .mockReturnValueOnce(queryResult(mockAudioData))
      .mockReturnValueOnce(queryResult(mockProjectData));

    render(<AudioList />);

    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("should filter by project when selected", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();

    // Initial render
    mockUseQuery
      .mockReturnValueOnce(queryResult(mockAudioData))
      .mockReturnValueOnce(queryResult(mockProjectData));

    render(<AudioList />);

    const select = screen.getByLabelText("Filter by project");

    // Re-mock for re-render after selection
    mockUseQuery
      .mockReturnValueOnce(queryResult(mockAudioData))
      .mockReturnValueOnce(queryResult(mockProjectData));

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

    mockUseQuery
      .mockReturnValueOnce(queryResult(smallFileData))
      .mockReturnValueOnce(queryResult({ data: [] }));

    render(<AudioList />);

    expect(screen.getByText(/512 B/)).toBeInTheDocument();
  });
});
