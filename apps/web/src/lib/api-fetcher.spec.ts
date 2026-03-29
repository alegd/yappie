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

vi.mock("@/config/auth.config", () => ({
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

  it("should send multipart form data when Content-Type is multipart/form-data", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: "a-1" }),
    });

    const file = new File(["audio"], "test.mp3", { type: "audio/mpeg" });

    await apiFetcher("/v1/audio/upload", {
      method: "POST",
      data: { file: { name: "file", value: [file] } },
      headers: { "Content-Type": "multipart/form-data" },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: expect.any(FormData),
      }),
    );
  });

  it("should return error with 'Forbidden' for 403 response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ statusCode: 403, error: { message: "No access" } }),
    });

    const result = await apiFetcher("/v1/admin");

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: "Forbidden",
      }),
    );
  });

  it("should return error with 'Not Found' for 404 response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      text: async () => JSON.stringify({ statusCode: 404, error: { message: "Missing" } }),
    });

    const result = await apiFetcher("/v1/tickets/nonexistent");

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: "Not Found",
      }),
    );
  });

  it("should return error message for 422 response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => JSON.stringify({ statusCode: 422, error: { message: "Invalid input" } }),
    });

    const result = await apiFetcher("/v1/tickets");

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: "Invalid input",
      }),
    );
  });

  it("should return error message for 500 response", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () =>
        JSON.stringify({ statusCode: 500, error: { message: "Internal server error" } }),
    });

    const result = await apiFetcher("/v1/tickets");

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: "Internal server error",
      }),
    );
  });

  it("should return null for empty response body", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => "",
    });

    const result = await apiFetcher("/v1/tickets/t-1", { method: "DELETE" });

    expect(result).toBeNull();
  });

  it("should append nested object fields as key[nested] in multipart form data", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: "a-2" }),
    });

    await apiFetcher("/v1/audio/upload", {
      method: "POST",
      data: {
        file: { name: "file", value: [] },
        meta: { projectId: "p-1", label: "test" },
      },
      headers: { "Content-Type": "multipart/form-data" },
    });

    const [, calledOptions] = mockFetch.mock.calls[0];
    const formData = calledOptions.body as FormData;
    expect(formData.get("meta[projectId]")).toBe("p-1");
    expect(formData.get("meta[label]")).toBe("test");
  });

  it("should append array values as JSON string in multipart form data", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: "a-3" }),
    });

    await apiFetcher("/v1/audio/upload", {
      method: "POST",
      data: {
        file: { name: "file", value: [] },
        tags: ["a", "b"],
      },
      headers: { "Content-Type": "multipart/form-data" },
    });

    const [, calledOptions] = mockFetch.mock.calls[0];
    const formData = calledOptions.body as FormData;
    expect(formData.get("tags")).toBe(JSON.stringify(["a", "b"]));
  });

  it("should append primitive field values in multipart form data", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: "a-4" }),
    });

    await apiFetcher("/v1/audio/upload", {
      method: "POST",
      data: {
        file: { name: "file", value: [] },
        title: "My recording",
      },
      headers: { "Content-Type": "multipart/form-data" },
    });

    const [, calledOptions] = mockFetch.mock.calls[0];
    const formData = calledOptions.body as FormData;
    expect(formData.get("title")).toBe("My recording");
  });

  it("should skip null/undefined fields in multipart form data", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ id: "a-5" }),
    });

    await apiFetcher("/v1/audio/upload", {
      method: "POST",
      data: {
        file: { name: "file", value: [] },
        notes: null,
      },
      headers: { "Content-Type": "multipart/form-data" },
    });

    const [, calledOptions] = mockFetch.mock.calls[0];
    const formData = calledOptions.body as FormData;
    expect(formData.get("notes")).toBeNull();
  });

  it("should redirect on 401 without invalid_credentials key via parseError", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () =>
        JSON.stringify({
          statusCode: 401,
          error: { message: "Session expired" },
        }),
    });

    await expect(apiFetcher("/v1/tickets")).rejects.toThrow("NEXT_REDIRECT:/logout");
    expect(mockRedirect).toHaveBeenCalledWith("/logout");
  });

  it("should return error for unknown status code (default case)", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 418,
      text: async () => JSON.stringify({ statusCode: 418, error: { message: "I'm a teapot" } }),
    });

    const result = await apiFetcher("/v1/tickets");

    expect(result).toEqual(
      expect.objectContaining({
        success: false,
        error: "I'm a teapot",
      }),
    );
  });
});
