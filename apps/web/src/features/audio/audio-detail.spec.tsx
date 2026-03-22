import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AudioDetail } from "./audio-detail";

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    get: mockGet,
    setToken: vi.fn(),
  },
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

describe("AudioDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state initially", () => {
    mockGet.mockReturnValue(new Promise(() => {})); // never resolves
    render(<AudioDetail audioId="audio-1" />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("should display audio file name after loading", async () => {
    mockGet.mockResolvedValue(mockAudio);
    render(<AudioDetail audioId="audio-1" />);

    expect(await screen.findByText("standup-notes.mp3")).toBeInTheDocument();
  });

  it("should display transcription text", async () => {
    mockGet.mockResolvedValue(mockAudio);
    render(<AudioDetail audioId="audio-1" />);

    expect(await screen.findByText("We need to fix the login bug in Safari.")).toBeInTheDocument();
  });

  it("should display generated tickets", async () => {
    mockGet.mockResolvedValue(mockAudio);
    render(<AudioDetail audioId="audio-1" />);

    expect(await screen.findByText("Fix Safari login bug")).toBeInTheDocument();
    expect(screen.getByText("Update button design")).toBeInTheDocument();
  });

  it("should show status badge", async () => {
    mockGet.mockResolvedValue(mockAudio);
    render(<AudioDetail audioId="audio-1" />);

    expect(await screen.findByText("Completed")).toBeInTheDocument();
  });

  it("should show error state when fetch fails", async () => {
    mockGet.mockRejectedValue(new Error("Not found"));
    render(<AudioDetail audioId="audio-1" />);

    expect(await screen.findByText(/not found/i)).toBeInTheDocument();
  });
});
