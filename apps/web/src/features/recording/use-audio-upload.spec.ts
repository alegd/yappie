import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FileTooLargeError, useAudioUpload } from "./use-audio-upload";

const { mockFetcher } = vi.hoisted(() => ({
  mockFetcher: vi.fn(),
}));

vi.mock("@/lib/api-fetcher", () => ({
  apiFetcher: mockFetcher,
}));

function makeFile(sizeBytes: number, type = "audio/webm"): File {
  const blob = new Blob([new Uint8Array(sizeBytes)], { type });
  return new File([blob], "test.webm", { type });
}

describe("useAudioUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects files larger than 5 MB with FileTooLargeError", async () => {
    const { result } = renderHook(() => useAudioUpload("p-1"));
    const file = makeFile(6 * 1024 * 1024);

    await expect(result.current.upload(file)).rejects.toBeInstanceOf(FileTooLargeError);
    expect(mockFetcher).not.toHaveBeenCalled();
  });

  it("posts to AUDIO_UPLOAD with projectId query and returns the response", async () => {
    mockFetcher.mockResolvedValue({ id: "a-1", fileName: "test.webm" });
    const { result } = renderHook(() => useAudioUpload("p-1"));
    const file = makeFile(1024);

    let response;
    await act(async () => {
      response = await result.current.upload(file);
    });

    expect(mockFetcher).toHaveBeenCalledWith(
      expect.stringContaining("/v1/audio/upload?projectId=p-1"),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "multipart/form-data" },
        data: { file: { name: "file", value: [file] } },
      }),
    );
    expect(response).toEqual({ id: "a-1", fileName: "test.webm" });
  });

  it("propagates network errors", async () => {
    mockFetcher.mockRejectedValue(new Error("network down"));
    const { result } = renderHook(() => useAudioUpload("p-1"));

    await expect(result.current.upload(makeFile(1024))).rejects.toThrow("network down");
  });

  it("toggles isUploading around the call", async () => {
    let resolve!: (v: unknown) => void;
    mockFetcher.mockReturnValue(new Promise((r) => (resolve = r)));

    const { result } = renderHook(() => useAudioUpload("p-1"));
    expect(result.current.isUploading).toBe(false);

    let uploadPromise: Promise<unknown> | undefined;
    act(() => {
      uploadPromise = result.current.upload(makeFile(1024));
    });
    expect(result.current.isUploading).toBe(true);

    await act(async () => {
      resolve({ id: "a-1" });
      await uploadPromise;
    });
    expect(result.current.isUploading).toBe(false);
  });
});
