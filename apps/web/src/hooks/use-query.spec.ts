import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGlobalMutate } = vi.hoisted(() => ({ mockGlobalMutate: vi.fn() }));

vi.mock("swr", () => ({
  default: vi.fn(),
  mutate: mockGlobalMutate,
}));

vi.mock("swr/mutation", () => ({ default: vi.fn() }));

vi.mock("@/lib/api-fetcher", () => ({ apiFetcher: vi.fn() }));

import { invalidateQuery, invalidateQueryPrefix } from "./use-query";

type KeyPredicate = (key: unknown) => boolean;

function capturePredicate(prefix: string): KeyPredicate {
  invalidateQueryPrefix(prefix);
  return mockGlobalMutate.mock.calls[0][0] as KeyPredicate;
}

describe("invalidateQuery", () => {
  beforeEach(() => vi.clearAllMocks());

  it("invalidates exactly the key it is given", () => {
    invalidateQuery("/v1/projects/p-1");

    expect(mockGlobalMutate).toHaveBeenCalledWith("/v1/projects/p-1");
  });
});

describe("invalidateQueryPrefix", () => {
  beforeEach(() => vi.clearAllMocks());

  it("matches every string key starting with the prefix", () => {
    const matches = capturePredicate("/v1/projects");

    expect(matches("/v1/projects")).toBe(true);
    expect(matches("/v1/projects/p-1")).toBe(true);
    expect(matches("/v1/projects?limit=50")).toBe(true);
  });

  it("leaves keys outside the prefix alone", () => {
    const matches = capturePredicate("/v1/projects");

    expect(matches("/v1/audio?limit=50")).toBe(false);
    expect(matches("/v1/tickets/t-1")).toBe(false);
  });

  it("rejects non-string keys instead of throwing", () => {
    const matches = capturePredicate("/v1/projects");

    expect(matches(["/v1/projects", 1])).toBe(false);
    expect(matches(null)).toBe(false);
    expect(matches(undefined)).toBe(false);
  });
});
