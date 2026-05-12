const mockStorage = new Map<string, string>();

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
  setItemAsync: jest.fn(async (key: string, value: string) => {
    mockStorage.set(key, value);
  }),
  deleteItemAsync: jest.fn(async (key: string) => {
    mockStorage.delete(key);
  }),
}));

jest.mock("./env", () => ({ env: { apiUrl: "https://api.test" } }));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const tokenStorage = require("./secure-store") as typeof import("./secure-store");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { apiFetch } = require("./api") as typeof import("./api");

const fetchMock = jest.fn();
global.fetch = fetchMock as unknown as typeof fetch;

describe("apiFetch", () => {
  beforeEach(async () => {
    mockStorage.clear();
    fetchMock.mockReset();
  });

  it("returns parsed JSON on 200 with auth header", async () => {
    await tokenStorage.setAccessToken("token-123");
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: "u1" }),
    } as Response);

    const result = await apiFetch<{ id: string }>("/users/me");

    expect(result).toEqual({ id: "u1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.test/api/v1/users/me",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token-123" }),
      }),
    );
  });

  it("throws ApiError on 4xx non-401", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: "Bad input" }),
    } as Response);

    await expect(apiFetch("/foo")).rejects.toMatchObject({ status: 400, message: "Bad input" });
  });

  it("on 401 refreshes token and retries the original request", async () => {
    await tokenStorage.setAccessToken("old-token");
    await tokenStorage.setRefreshToken("refresh-token");

    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: "new-token", refreshToken: "new-refresh" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      } as Response);

    const result = await apiFetch<{ ok: boolean }>("/protected");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(await tokenStorage.getAccessToken()).toBe("new-token");
    expect(await tokenStorage.getRefreshToken()).toBe("new-refresh");
  });

  it("on 401 + refresh failure, clears tokens and throws auth error", async () => {
    await tokenStorage.setAccessToken("old-token");
    await tokenStorage.setRefreshToken("refresh-token");

    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as Response)
      .mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as Response);

    await expect(apiFetch("/protected")).rejects.toMatchObject({ status: 401 });
    expect(await tokenStorage.getAccessToken()).toBeNull();
    expect(await tokenStorage.getRefreshToken()).toBeNull();
  });

  it("does NOT attempt refresh when no refresh token is stored", async () => {
    await tokenStorage.setAccessToken("only-access");
    fetchMock.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({}) } as Response);

    await expect(apiFetch("/protected")).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
