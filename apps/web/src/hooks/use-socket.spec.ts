import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSocket } from "./use-socket";

const mockOn = vi.fn();
const mockDisconnect = vi.fn();

const { mockIo } = vi.hoisted(() => ({
  mockIo: vi.fn(),
}));

vi.mock("socket.io-client", () => ({
  io: mockIo,
}));

vi.mock("@/components/ui/toast/Toast", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("./use-query", () => ({
  invalidateQuery: vi.fn(),
}));

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

    const eventNames = mockOn.mock.calls.map((call: string[]) => call[0]);
    expect(eventNames).toContain("audio:progress");
    expect(eventNames).toContain("audio:completed");
    expect(eventNames).toContain("audio:failed");
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
