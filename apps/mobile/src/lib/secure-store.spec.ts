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

// eslint-disable-next-line @typescript-eslint/no-require-imports
const tokenStorage = require("./secure-store") as typeof import("./secure-store");

describe("tokenStorage", () => {
  beforeEach(() => {
    mockStorage.clear();
    jest.clearAllMocks();
  });

  it("setAccessToken writes to SecureStore under yappie.accessToken", async () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SecureStore = require("expo-secure-store");
    await tokenStorage.setAccessToken("abc");
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith("yappie.accessToken", "abc");
  });

  it("getAccessToken reads from SecureStore", async () => {
    await tokenStorage.setAccessToken("abc");
    expect(await tokenStorage.getAccessToken()).toBe("abc");
  });

  it("getAccessToken returns null when not set", async () => {
    expect(await tokenStorage.getAccessToken()).toBeNull();
  });

  it("setRefreshToken / getRefreshToken work symmetrically", async () => {
    await tokenStorage.setRefreshToken("rt");
    expect(await tokenStorage.getRefreshToken()).toBe("rt");
  });

  it("clearTokens removes both access and refresh tokens", async () => {
    await tokenStorage.setAccessToken("at");
    await tokenStorage.setRefreshToken("rt");
    await tokenStorage.clearTokens();
    expect(await tokenStorage.getAccessToken()).toBeNull();
    expect(await tokenStorage.getRefreshToken()).toBeNull();
  });
});
