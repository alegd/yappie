import "@testing-library/jest-dom/vitest";

// jsdom does not implement IntersectionObserver; stub it for tests that rely on it.
// Individual tests can still swap in their own mock via globalThis.IntersectionObserver = ...
if (typeof globalThis.IntersectionObserver === "undefined") {
  globalThis.IntersectionObserver = class {
    root = null;
    rootMargin = "";
    thresholds = [];
    disconnect() {}
    observe() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  } as unknown as typeof IntersectionObserver;
}
