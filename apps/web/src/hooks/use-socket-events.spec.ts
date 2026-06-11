import { beforeEach, describe, expect, it } from "vitest";
import { useSocketEvents } from "./use-socket-events";

describe("useSocketEvents", () => {
  beforeEach(() => {
    useSocketEvents.setState({ lastAudioCompleted: null });
  });

  it("starts with no last completed audio", () => {
    expect(useSocketEvents.getState().lastAudioCompleted).toBeNull();
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

  it("emitting twice with the same audioId still produces a new timestamp", async () => {
    useSocketEvents.getState().emitAudioCompleted({ audioId: "a-1", ticketCount: 1 });
    const first = useSocketEvents.getState().lastAudioCompleted!;
    await new Promise((r) => setTimeout(r, 5));
    useSocketEvents.getState().emitAudioCompleted({ audioId: "a-1", ticketCount: 1 });
    const second = useSocketEvents.getState().lastAudioCompleted!;
    expect(second.at).toBeGreaterThan(first.at);
  });
});
