import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AudioUpload } from "./audio-upload";

const { mockUpload } = vi.hoisted(() => ({
  mockUpload: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    upload: mockUpload,
  },
}));

vi.mock("@/lib/constants/endpoints", () => ({
  AUDIO_UPLOAD: "/audio/upload",
}));

const mockOnUploaded = vi.fn();

describe("AudioUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render upload and record buttons", () => {
    render(<AudioUpload onUploaded={mockOnUploaded} />);

    expect(screen.getByText("Upload audio")).toBeInTheDocument();
    expect(screen.getByText("Record")).toBeInTheDocument();
  });

  it("should show 'Upload audio' text on upload button", () => {
    render(<AudioUpload onUploaded={mockOnUploaded} />);

    const uploadButton = screen.getByText("Upload audio").closest("button");
    expect(uploadButton).toBeInTheDocument();
    expect(uploadButton).toHaveTextContent("Upload audio");
  });

  it("should show 'Record' text on record button", () => {
    render(<AudioUpload onUploaded={mockOnUploaded} />);

    const recordButton = screen.getByText("Record").closest("button");
    expect(recordButton).toBeInTheDocument();
    expect(recordButton).toHaveTextContent("Record");
  });

  it("should not have buttons disabled initially", () => {
    render(<AudioUpload onUploaded={mockOnUploaded} />);

    const uploadButton = screen.getByText("Upload audio").closest("button");
    const recordButton = screen.getByText("Record").closest("button");

    expect(uploadButton).not.toBeDisabled();
    expect(recordButton).not.toBeDisabled();
  });

  it("should call api.upload when file is selected", async () => {
    const mockResult = { id: "a-1", fileName: "test.mp3" };
    mockUpload.mockResolvedValue(mockResult);

    const { container } = render(<AudioUpload onUploaded={mockOnUploaded} />);

    const file = new File(["audio"], "test.mp3", { type: "audio/mpeg" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith("/audio/upload", file, {});
    });

    await waitFor(() => {
      expect(mockOnUploaded).toHaveBeenCalledWith(mockResult);
    });
  });

  it("should call api.upload with projectId when provided", async () => {
    const mockResult = { id: "a-1", fileName: "test.mp3" };
    mockUpload.mockResolvedValue(mockResult);

    const { container } = render(<AudioUpload projectId="p-1" onUploaded={mockOnUploaded} />);

    const file = new File(["audio"], "test.mp3", { type: "audio/mpeg" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith("/audio/upload", file, {
        projectId: "p-1",
      });
    });
  });

  it("should not call upload when no file selected", async () => {
    const { container } = render(<AudioUpload onUploaded={mockOnUploaded} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [] } });

    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("should start and stop recording", async () => {
    const mockStop = vi.fn();
    const mockStart = vi.fn();

    const mockStream = {
      getTracks: vi.fn().mockReturnValue([{ stop: vi.fn() }]),
    };

    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      configurable: true,
    });

    class MockMediaRecorder {
      ondataavailable: any = null;
      onstop: any = null;
      start = mockStart;
      stop = mockStop;
    }
    vi.stubGlobal("MediaRecorder", MockMediaRecorder);

    const user = (await import("@testing-library/user-event")).default.setup();
    render(<AudioUpload onUploaded={mockOnUploaded} />);

    const recordButton = screen.getByText("Record").closest("button")!;
    await user.click(recordButton);

    await waitFor(() => {
      expect(screen.getByText("Stop")).toBeInTheDocument();
    });
    expect(mockStart).toHaveBeenCalled();

    const stopButton = screen.getByText("Stop").closest("button")!;
    await user.click(stopButton);

    expect(mockStop).toHaveBeenCalled();
  });

  it("should show error when microphone access denied", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error("Denied")) },
      configurable: true,
    });

    const user = (await import("@testing-library/user-event")).default.setup();
    render(<AudioUpload onUploaded={mockOnUploaded} />);

    const recordButton = screen.getByText("Record").closest("button")!;
    await user.click(recordButton);

    await waitFor(() => {
      expect(screen.getByText("Microphone access denied")).toBeInTheDocument();
    });
  });

  it("should show error message when upload fails", async () => {
    mockUpload.mockRejectedValue(new Error("Upload failed"));

    const { container } = render(<AudioUpload onUploaded={mockOnUploaded} />);

    const file = new File(["audio"], "test.mp3", { type: "audio/mpeg" });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Upload failed")).toBeInTheDocument();
    });
  });
});
