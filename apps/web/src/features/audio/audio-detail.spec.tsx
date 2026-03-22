import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AudioDetail } from "./audio-detail";

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock("@/hooks/use-query", () => ({
  useQuery: mockUseQuery,
  invalidateQuery: vi.fn(),
}));

const mockAudio = {
  id: "audio-1",
  fileName: "standup-notes.mp3",
  fileSize: 1048576,
  mimeType: "audio/mpeg",
  status: "COMPLETED" as const,
  transcription: "We need to fix the login bug in Safari.",
  createdAt: "2026-03-21T10:00:00.000Z",
  updatedAt: "2026-03-21T10:01:00.000Z",
  userId: "user-1",
  filePath: "user-1/standup.mp3",
  duration: null,
  errorMessage: null,
  projectId: null,
  tickets: [
    { id: "t-1", title: "Fix Safari login bug", status: "DRAFT", priority: "HIGH" },
    { id: "t-2", title: "Update button design", status: "APPROVED", priority: "MEDIUM" },
  ],
};

const queryResult = (data: unknown, isLoading = false, error?: Error) => ({
  data,
  error,
  isLoading,
  mutate: vi.fn(),
});

describe("AudioDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state initially", () => {
    mockUseQuery.mockReturnValue(queryResult(undefined, true));
    render(<AudioDetail audioId="audio-1" />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should display audio file name after loading", () => {
    mockUseQuery.mockReturnValue(queryResult(mockAudio));
    render(<AudioDetail audioId="audio-1" />);
    expect(screen.getByText("standup-notes.mp3")).toBeInTheDocument();
  });

  it("should display transcription text", () => {
    mockUseQuery.mockReturnValue(queryResult(mockAudio));
    render(<AudioDetail audioId="audio-1" />);
    expect(screen.getByText("We need to fix the login bug in Safari.")).toBeInTheDocument();
  });

  it("should display generated tickets", () => {
    mockUseQuery.mockReturnValue(queryResult(mockAudio));
    render(<AudioDetail audioId="audio-1" />);
    expect(screen.getByText("Fix Safari login bug")).toBeInTheDocument();
    expect(screen.getByText("Update button design")).toBeInTheDocument();
  });

  it("should show status badge", () => {
    mockUseQuery.mockReturnValue(queryResult(mockAudio));
    render(<AudioDetail audioId="audio-1" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("should show error state when fetch fails", () => {
    mockUseQuery.mockReturnValue(queryResult(undefined, false, new Error("Not found")));
    render(<AudioDetail audioId="audio-1" />);
    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});
