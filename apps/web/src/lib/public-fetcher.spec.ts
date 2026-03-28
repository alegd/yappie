import { describe, it, expect, vi, beforeEach } from "vitest";
import { publicFetcher } from "./public-fetcher";

describe("publicFetcher", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should return parsed JSON on successful response", async () => {
    const mockData = { id: 1, name: "Test" };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      }),
    );

    const result = await publicFetcher("/auth/otp");

    expect(result).toEqual(mockData);
  });

  it("should throw Error with message from response on failed request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ message: "Too many requests" }),
      }),
    );

    await expect(publicFetcher("/auth/otp")).rejects.toThrow("Too many requests");
  });

  it("should throw Error with fallback message when response has no message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      }),
    );

    await expect(publicFetcher("/auth/otp")).rejects.toThrow("Request failed");
  });

  it("should default to POST method", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    await publicFetcher("/auth/otp");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/otp",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("should use a custom method when specified", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    await publicFetcher("/auth/otp", { method: "GET" });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/otp",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("should serialize data as JSON body", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    const data = { email: "user@example.com" };
    await publicFetcher("/auth/otp", { data });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/otp",
      expect.objectContaining({
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  it("should send undefined body when no data provided", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });
    vi.stubGlobal("fetch", mockFetch);

    await publicFetcher("/auth/otp");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/auth/otp",
      expect.objectContaining({ body: undefined }),
    );
  });
});
