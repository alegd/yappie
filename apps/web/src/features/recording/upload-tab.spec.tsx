import { fireEvent, render, screen, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UploadTab } from "./upload-tab";

const { mockUpload, mockToastError } = vi.hoisted(() => ({
  mockUpload: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("./use-audio-upload", () => ({
  useAudioUpload: () => ({ upload: mockUpload, isUploading: false }),
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  toast: { error: mockToastError, success: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function makeFile(type = "audio/webm", size = 1024): File {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], `f.${type.split("/")[1]}`, { type });
}

describe("UploadTab", () => {
  it("renders a drop zone and Choose file button", () => {
    render(
      <UploadTab
        projectId="p-1"
        onUploaded={vi.fn()}
        onError={vi.fn()}
        onUploadingChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/drop zone/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /choose file/i })).toBeInTheDocument();
  });

  it("disables Choose file when disabled prop is true", () => {
    render(
      <UploadTab
        projectId=""
        disabled
        onUploaded={vi.fn()}
        onError={vi.fn()}
        onUploadingChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /choose file/i })).toBeDisabled();
  });

  it("rejects non-audio files via toast.error without calling upload", async () => {
    render(
      <UploadTab
        projectId="p-1"
        onUploaded={vi.fn()}
        onError={vi.fn()}
        onUploadingChange={vi.fn()}
      />,
    );
    const input = screen.getByLabelText(/audio file input/i) as HTMLInputElement;
    const file = makeFile("application/pdf");

    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
    });

    expect(mockToastError).toHaveBeenCalledWith("Audio files only");
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("uploads valid audio files via file picker and emits onUploaded(id)", async () => {
    mockUpload.mockResolvedValue({ id: "a-1" });
    const onUploaded = vi.fn();
    const onUploadingChange = vi.fn();
    render(
      <UploadTab
        projectId="p-1"
        onUploaded={onUploaded}
        onError={vi.fn()}
        onUploadingChange={onUploadingChange}
      />,
    );
    const input = screen.getByLabelText(/audio file input/i) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile()] } });
    });

    expect(mockUpload).toHaveBeenCalled();
    expect(onUploaded).toHaveBeenCalledWith("a-1");
    expect(onUploadingChange).toHaveBeenNthCalledWith(1, true);
    expect(onUploadingChange).toHaveBeenLastCalledWith(false);
  });

  it("uploads on drop with a valid audio file", async () => {
    mockUpload.mockResolvedValue({ id: "a-2" });
    const onUploaded = vi.fn();
    render(
      <UploadTab
        projectId="p-1"
        onUploaded={onUploaded}
        onError={vi.fn()}
        onUploadingChange={vi.fn()}
      />,
    );
    const dropZone = screen.getByLabelText(/drop zone/i);

    await act(async () => {
      fireEvent.drop(dropZone, { dataTransfer: { files: [makeFile()] } });
    });

    expect(onUploaded).toHaveBeenCalledWith("a-2");
  });

  it("emits onError(_, true) when upload throws", async () => {
    mockUpload.mockRejectedValue(new Error("boom"));
    const onError = vi.fn();
    render(
      <UploadTab
        projectId="p-1"
        onUploaded={vi.fn()}
        onError={onError}
        onUploadingChange={vi.fn()}
      />,
    );
    const input = screen.getByLabelText(/audio file input/i) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { files: [makeFile()] } });
    });

    expect(onError).toHaveBeenCalledWith("boom", true);
  });
});
