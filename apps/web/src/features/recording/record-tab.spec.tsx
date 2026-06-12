import { render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RecordTab } from "./record-tab";

const { mockUpload } = vi.hoisted(() => ({
  mockUpload: vi.fn(),
}));

vi.mock("./use-audio-upload", () => ({
  useAudioUpload: () => ({ upload: mockUpload, isUploading: false }),
}));

vi.mock("./waveform-decorative", () => ({
  WaveformDecorative: () => <div data-testid="waveform" />,
}));

interface FakeRecorder {
  start: () => void;
  stop: () => void;
  ondataavailable: ((e: { data: Blob }) => void) | null;
  onstop: (() => Promise<void> | void) | null;
}

let currentRecorder: FakeRecorder | null = null;
let mockGetUserMedia: ReturnType<typeof vi.fn>;
let mockStop: ReturnType<typeof vi.fn>;

class MockMediaRecorder implements FakeRecorder {
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => Promise<void> | void) | null = null;
  start = vi.fn();
  stop = vi.fn(() => {
    this.onstop?.();
  });

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    currentRecorder = this;
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  currentRecorder = null;
  mockStop = vi.fn();
  mockGetUserMedia = vi.fn().mockResolvedValue({
    getTracks: () => [{ stop: mockStop }],
  });
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: mockGetUserMedia },
  });
  vi.stubGlobal("MediaRecorder", MockMediaRecorder);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("RecordTab", () => {
  it("renders a Start button when idle", () => {
    render(
      <RecordTab
        projectId="p-1"
        onUploaded={vi.fn()}
        onError={vi.fn()}
        onUploadingChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /start recording/i })).toBeInTheDocument();
  });

  it("disables Start when disabled prop is true", () => {
    render(
      <RecordTab
        projectId=""
        disabled
        onUploaded={vi.fn()}
        onError={vi.fn()}
        onUploadingChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /start recording/i })).toBeDisabled();
  });

  it("calls onError(_, false) when MediaRecorder is unavailable", async () => {
    vi.stubGlobal("MediaRecorder", undefined);
    const onError = vi.fn();
    render(
      <RecordTab
        projectId="p-1"
        onUploaded={vi.fn()}
        onError={onError}
        onUploadingChange={vi.fn()}
      />,
    );
    await act(async () => {
      screen.getByRole("button", { name: /start recording/i }).click();
    });
    expect(onError).toHaveBeenCalledWith(expect.stringContaining("not supported"), false);
  });

  it("calls onError(_, true) when getUserMedia is denied", async () => {
    mockGetUserMedia.mockRejectedValue(new Error("denied"));
    const onError = vi.fn();
    render(
      <RecordTab
        projectId="p-1"
        onUploaded={vi.fn()}
        onError={onError}
        onUploadingChange={vi.fn()}
      />,
    );
    await act(async () => {
      screen.getByRole("button", { name: /start recording/i }).click();
    });
    expect(onError).toHaveBeenCalledWith(expect.stringContaining("Microphone"), true);
  });

  it("starts recording and shows waveform, timer and Stop", async () => {
    render(
      <RecordTab
        projectId="p-1"
        onUploaded={vi.fn()}
        onError={vi.fn()}
        onUploadingChange={vi.fn()}
      />,
    );
    await act(async () => {
      screen.getByRole("button", { name: /start recording/i }).click();
    });
    expect(currentRecorder?.start).toHaveBeenCalled();
    expect(screen.getByTestId("waveform")).toBeInTheDocument();
    expect(screen.getByLabelText(/recording timer/i)).toHaveTextContent("00:00");
    expect(screen.getByRole("button", { name: /stop/i })).toBeInTheDocument();
  });

  it("ticks the timer once per second while recording", async () => {
    render(
      <RecordTab
        projectId="p-1"
        onUploaded={vi.fn()}
        onError={vi.fn()}
        onUploadingChange={vi.fn()}
      />,
    );
    await act(async () => {
      screen.getByRole("button", { name: /start recording/i }).click();
    });
    await act(async () => {
      vi.advanceTimersByTime(2_500);
    });
    expect(screen.getByLabelText(/recording timer/i).textContent).toMatch(/00:0[12]/);
  });

  it("on Stop uploads the blob, signals uploadingChange, then onUploaded(audioId)", async () => {
    mockUpload.mockResolvedValue({ id: "a-42" });
    const onUploaded = vi.fn();
    const onUploadingChange = vi.fn();
    render(
      <RecordTab
        projectId="p-1"
        onUploaded={onUploaded}
        onError={vi.fn()}
        onUploadingChange={onUploadingChange}
      />,
    );
    await act(async () => {
      screen.getByRole("button", { name: /start recording/i }).click();
    });
    currentRecorder?.ondataavailable?.({ data: new Blob(["chunk"], { type: "audio/webm" }) });

    await act(async () => {
      screen.getByRole("button", { name: /stop/i }).click();
      await Promise.resolve();
    });

    expect(mockUpload).toHaveBeenCalled();
    expect(onUploadingChange).toHaveBeenNthCalledWith(1, true);
    expect(onUploadingChange).toHaveBeenLastCalledWith(false);
    expect(onUploaded).toHaveBeenCalledWith("a-42");
    expect(mockStop).toHaveBeenCalled();
  });

  it("on upload error calls onError(_, true)", async () => {
    mockUpload.mockRejectedValue(new Error("boom"));
    const onError = vi.fn();
    render(
      <RecordTab
        projectId="p-1"
        onUploaded={vi.fn()}
        onError={onError}
        onUploadingChange={vi.fn()}
      />,
    );
    await act(async () => {
      screen.getByRole("button", { name: /start recording/i }).click();
    });
    await act(async () => {
      screen.getByRole("button", { name: /stop/i }).click();
      await Promise.resolve();
    });
    expect(onError).toHaveBeenCalledWith("boom", true);
  });
});
