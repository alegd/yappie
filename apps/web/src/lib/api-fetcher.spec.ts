import { beforeEach, describe, expect, it, vi } from "vitest";

const mockAuth = vi.fn();
class RedirectError extends Error {
  url: string;
  constructor(url: string) {
    super(`NEXT_REDIRECT:${url}`);
    this.url = url;
  }
}

const mockRedirect = vi.fn((url: string) => {
  throw new RedirectError(url);
});

vi.mock("./auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("next/navigation", () => ({
  redirect: (url: string) => mockRedirect(url),
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

const { apiFetcher } = await import("./api-fetcher");

describe("apiFetcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("NEXT_PUBLIC_HOST_URL", "http://localhost:3000");
    mockAuth.mockResolvedValue({ accessToken: "test-token" });
  });

  it("should make authenticated GET request", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ data: "result" }),
    });

    const result = await apiFetcher("/v1/tickets");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/v1/tickets"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-token",
        }),
      }),
    );
    expect(result).toEqual({ data: "result" });
  });

  it("should send JSON body for POST with data", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: "new-1" }),
    });

    await apiFetcher("/v1/tickets", {
      method: "POST",
      data: { title: "Test" },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ title: "Test" }),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        }),
      }),
    );
  });

  it("should return error object on 400 response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      text: async () =>
        JSON.stringify({ statusCode: 400, error: { message: "Validation failed" } }),
    });

    const result = await apiFetcher("/v1/tickets");

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: "Validation failed",
      }),
    );
  });

  it("should redirect on 401 response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ statusCode: 401, error: { message: "Unauthorized" } }),
    });

    await expect(apiFetcher("/v1/tickets")).rejects.toThrow("NEXT_REDIRECT:/logout");
    expect(mockRedirect).toHaveBeenCalledWith("/logout");
  });

  it("should not redirect on 401 with invalid_credentials key", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () =>
        JSON.stringify({
          statusCode: 401,
          key: "invalid_credentials",
          error: { message: "Wrong password", key: "invalid_credentials" },
        }),
    });

    const result = await apiFetcher("/v1/auth/login", {
      method: "POST",
      data: { email: "test@test.com", password: "wrong" },
    });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        success: false,
      }),
    );
  });

  it("should use custom token when provided", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({}),
    });

    await apiFetcher("/v1/tickets", { token: "custom-token" });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer custom-token",
        }),
      }),
    );
  });
});
