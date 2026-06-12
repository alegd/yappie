import { render, screen, act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSocketEvents } from "@/hooks/use-socket-events";
import { ProcessingState } from "./processing-state";

beforeEach(() => {
  vi.useFakeTimers();
  useSocketEvents.setState({ lastAudioCompleted: null, lastAudioFailed: null });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ProcessingState", () => {
  it("renders processing label, spinner and continue-in-background button", () => {
    render(
      <ProcessingState
        audioId="a-1"
        onCompleted={vi.fn()}
        onFailed={vi.fn()}
        onTimeout={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/processing your audio/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue in background/i })).toBeInTheDocument();
  });

  it("calls onCompleted(ticketCount) when lastAudioCompleted matches audioId", () => {
    const onCompleted = vi.fn();
    render(
      <ProcessingState
        audioId="a-1"
        onCompleted={onCompleted}
        onFailed={vi.fn()}
        onTimeout={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    act(() => {
      useSocketEvents.getState().emitAudioCompleted({ audioId: "a-1", ticketCount: 3 });
    });

    expect(onCompleted).toHaveBeenCalledWith(3);
  });

  it("ignores lastAudioCompleted for a different audioId", () => {
    const onCompleted = vi.fn();
    render(
      <ProcessingState
        audioId="a-1"
        onCompleted={onCompleted}
        onFailed={vi.fn()}
        onTimeout={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    act(() => {
      useSocketEvents.getState().emitAudioCompleted({ audioId: "a-other", ticketCount: 1 });
    });

    expect(onCompleted).not.toHaveBeenCalled();
  });

  it("calls onFailed(message) when lastAudioFailed matches audioId", () => {
    const onFailed = vi.fn();
    render(
      <ProcessingState
        audioId="a-1"
        onCompleted={vi.fn()}
        onFailed={onFailed}
        onTimeout={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    act(() => {
      useSocketEvents.getState().emitAudioFailed({ audioId: "a-1", error: "transcription failed" });
    });

    expect(onFailed).toHaveBeenCalledWith("transcription failed");
  });

  it("fires onTimeout after 60 seconds with no events", () => {
    const onTimeout = vi.fn();
    render(
      <ProcessingState
        audioId="a-1"
        onCompleted={vi.fn()}
        onFailed={vi.fn()}
        onTimeout={onTimeout}
        onCancel={vi.fn()}
      />,
    );

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when 'Continue in background' is clicked", () => {
    const onCancel = vi.fn();
    render(
      <ProcessingState
        audioId="a-1"
        onCompleted={vi.fn()}
        onFailed={vi.fn()}
        onTimeout={vi.fn()}
        onCancel={onCancel}
      />,
    );
    screen.getByRole("button", { name: /continue in background/i }).click();
    expect(onCancel).toHaveBeenCalled();
  });
});
