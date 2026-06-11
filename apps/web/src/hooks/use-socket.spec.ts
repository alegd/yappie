import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSocket } from "./use-socket";

const mockOn = vi.fn();
const mockDisconnect = vi.fn();

const { mockIo, mockGlobalMutate, mockEmitAudioCompleted, mockInvalidateQuery } = vi.hoisted(
  () => ({
    mockIo: vi.fn(),
    mockGlobalMutate: vi.fn(),
    mockEmitAudioCompleted: vi.fn(),
    mockInvalidateQuery: vi.fn(),
  }),
);

vi.mock("socket.io-client", () => ({
  io: mockIo,
}));

vi.mock("swr", async () => {
  const actual = await vi.importActual<typeof import("swr")>("swr");
  return {
    ...actual,
    mutate: mockGlobalMutate,
  };
});

vi.mock("./use-query", () => ({
  invalidateQuery: mockInvalidateQuery,
}));

vi.mock("./use-socket-events", () => ({
  useSocketEvents: {
    getState: () => ({ emitAudioCompleted: mockEmitAudioCompleted }),
  },
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function getHandler(event: string): (...args: unknown[]) => void {
  const call = mockOn.mock.calls.find((c) => c[0] === event);
  if (!call) throw new Error(`handler for ${event} not registered`);
  return call[1];
}

describe("useSocket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIo.mockReturnValue({
      on: mockOn,
      disconnect: mockDisconnect,
    });
  });

  it("should not connect when token is null", async () => {
    await act(async () => {
      renderHook(() => useSocket({ token: null }));
    });
    expect(mockIo).not.toHaveBeenCalled();
  });

  it("should connect with token in auth", async () => {
    await act(async () => {
      renderHook(() => useSocket({ token: "jwt-123" }));
    });
    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: { token: "jwt-123" },
        transports: ["websocket"],
      }),
    );
  });

  it("should register all three event listeners", async () => {
    await act(async () => {
      renderHook(() => useSocket({ token: "jwt-123" }));
    });
    const eventNames = mockOn.mock.calls.map((call: unknown[]) => call[0]);
    expect(eventNames).toContain("audio:progress");
    expect(eventNames).toContain("audio:completed");
    expect(eventNames).toContain("audio:failed");
  });

  it("audio:progress invalidates audio + projects + activity keys", async () => {
    await act(async () => {
      renderHook(() => useSocket({ token: "jwt-123" }));
    });
    const handler = getHandler("audio:progress");
    handler({ audioId: "a-1", status: "TRANSCRIBING" });

    expect(mockGlobalMutate).toHaveBeenCalled();
    const matcher = mockGlobalMutate.mock.calls[0][0] as (key: unknown) => boolean;
    expect(matcher("/v1/audio?limit=50")).toBe(true);
    expect(matcher("/v1/audio?limit=50&projectId=p-1")).toBe(true);
    expect(matcher("/v1/audio/a-1")).toBe(true);
    expect(matcher("/v1/projects?limit=50")).toBe(true);
    expect(matcher("/v1/projects/p-1")).toBe(true);
    expect(matcher("/v1/activity?limit=10")).toBe(true);
    expect(matcher("/v1/tickets?limit=50")).toBe(false);
    expect(matcher(null)).toBe(false);
  });

  it("audio:completed invalidates audio keys and tickets list and emits to useSocketEvents", async () => {
    await act(async () => {
      renderHook(() => useSocket({ token: "jwt-123" }));
    });
    const handler = getHandler("audio:completed");
    handler({ audioId: "a-9", ticketCount: 4 });

    expect(mockGlobalMutate).toHaveBeenCalled();
    expect(mockInvalidateQuery).toHaveBeenCalledWith("/v1/tickets?limit=50");
    expect(mockEmitAudioCompleted).toHaveBeenCalledWith({ audioId: "a-9", ticketCount: 4 });
  });

  it("audio:failed invalidates audio keys", async () => {
    await act(async () => {
      renderHook(() => useSocket({ token: "jwt-123" }));
    });
    const handler = getHandler("audio:failed");
    handler({ audioId: "a-2", error: "boom" });

    expect(mockGlobalMutate).toHaveBeenCalled();
  });

  it("should disconnect on unmount", async () => {
    let unmount!: () => void;
    await act(async () => {
      ({ unmount } = renderHook(() => useSocket({ token: "jwt-123" })));
    });
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
