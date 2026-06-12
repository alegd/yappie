import { beforeEach, describe, expect, it } from "vitest";
import { useSocketEvents } from "./use-socket-events";

describe("useSocketEvents", () => {
  beforeEach(() => {
    useSocketEvents.setState({ lastAudioCompleted: null, lastAudioFailed: null });
  });

  it("starts with no last completed audio", () => {
    expect(useSocketEvents.getState().lastAudioCompleted).toBeNull();
  });

  it("starts with no last failed audio", () => {
    expect(useSocketEvents.getState().lastAudioFailed).toBeNull();
  });

  it("emitAudioCompleted records the payload and a timestamp", () => {
    const before = Date.now();
    useSocketEvents.getState().emitAudioCompleted({
      audioId: "a-1",
      ticketCount: 3,
    });
    const after = Date.now();

    const last = useSocketEvents.getState().lastAudioCompleted;
    expect(last).not.toBeNull();
    expect(last?.audioId).toBe("a-1");
    expect(last?.ticketCount).toBe(3);
    expect(last?.at).toBeGreaterThanOrEqual(before);
    expect(last?.at).toBeLessThanOrEqual(after);
  });

  it("emitAudioCompleted twice for same audioId still produces a new timestamp", async () => {
    useSocketEvents.getState().emitAudioCompleted({ audioId: "a-1", ticketCount: 1 });
    const first = useSocketEvents.getState().lastAudioCompleted!;
    await new Promise((r) => setTimeout(r, 5));
    useSocketEvents.getState().emitAudioCompleted({ audioId: "a-1", ticketCount: 1 });
    const second = useSocketEvents.getState().lastAudioCompleted!;
    expect(second.at).toBeGreaterThan(first.at);
  });

  it("emitAudioFailed records the payload and a timestamp", () => {
    const before = Date.now();
    useSocketEvents.getState().emitAudioFailed({
      audioId: "a-9",
      error: "Transcription failed",
    });
    const after = Date.now();

    const last = useSocketEvents.getState().lastAudioFailed;
    expect(last).not.toBeNull();
    expect(last?.audioId).toBe("a-9");
    expect(last?.error).toBe("Transcription failed");
    expect(last?.at).toBeGreaterThanOrEqual(before);
    expect(last?.at).toBeLessThanOrEqual(after);
  });

  it("emitAudioFailed twice for same audioId still produces a new timestamp", async () => {
    useSocketEvents.getState().emitAudioFailed({ audioId: "a-1", error: "boom" });
    const first = useSocketEvents.getState().lastAudioFailed!;
    await new Promise((r) => setTimeout(r, 5));
    useSocketEvents.getState().emitAudioFailed({ audioId: "a-1", error: "boom" });
    const second = useSocketEvents.getState().lastAudioFailed!;
    expect(second.at).toBeGreaterThan(first.at);
  });
});
