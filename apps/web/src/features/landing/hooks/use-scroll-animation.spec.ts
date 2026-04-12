import { act, render, renderHook } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useScrollAnimation } from "./use-scroll-animation";

function HookHost({ onState }: { onState: (state: { isVisible: boolean }) => void }) {
  const { ref, isVisible } = useScrollAnimation();
  onState({ isVisible });
  return createElement("div", { ref: ref as never, "data-testid": "host" });
}

function createMockIntersectionObserver() {
  const observe = vi.fn();
  const disconnect = vi.fn();
  let trigger: ((entry: Partial<IntersectionObserverEntry>) => void) | null = null;

  class MockObserver {
    root = null;
    rootMargin = "";
    thresholds: number[] = [];
    observe = observe;
    disconnect = disconnect;
    unobserve = vi.fn();
    takeRecords = vi.fn();
    constructor(cb: IntersectionObserverCallback) {
      trigger = (entry) => cb([entry as IntersectionObserverEntry], this as IntersectionObserver);
    }
  }

  return {
    ctor: MockObserver,
    observe,
    disconnect,
    fire: (entry: Partial<IntersectionObserverEntry>) => trigger?.(entry),
  };
}

describe("useScrollAnimation", () => {
  let observerMock: ReturnType<typeof createMockIntersectionObserver>;
  let originalMatchMedia: typeof globalThis.matchMedia;

  beforeEach(() => {
    observerMock = createMockIntersectionObserver();
    globalThis.IntersectionObserver = observerMock.ctor as unknown as typeof IntersectionObserver;
    originalMatchMedia = globalThis.matchMedia;
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: false }) as never;
  });

  afterEach(() => {
    globalThis.matchMedia = originalMatchMedia;
  });

  it("should start with isVisible false", () => {
    const { result } = renderHook(() => useScrollAnimation());

    expect(result.current.isVisible).toBe(false);
  });

  it("should flip isVisible to true when the target intersects", () => {
    let state: { isVisible: boolean } = { isVisible: false };

    render(createElement(HookHost, { onState: (s) => (state = s) }));

    act(() => {
      observerMock.fire({ isIntersecting: true });
    });

    expect(state.isVisible).toBe(true);
  });

  it("should return isVisible true immediately when prefers-reduced-motion is on", () => {
    globalThis.matchMedia = vi.fn().mockReturnValue({ matches: true }) as never;

    const { result } = renderHook(() => useScrollAnimation());

    expect(result.current.isVisible).toBe(true);
  });

  it("should disconnect the observer on unmount", () => {
    const { unmount } = render(createElement(HookHost, { onState: () => {} }));

    unmount();

    expect(observerMock.disconnect).toHaveBeenCalled();
  });
});
