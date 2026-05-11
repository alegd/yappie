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
const tokenStorage = require("@/lib/secure-store") as typeof import("@/lib/secure-store");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useAuthStore } = require("./auth-store") as typeof import("./auth-store");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { makeUser } = require("@/test/factories/user") as typeof import("@/test/factories/user");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { makeTokenPair } = require("@/test/factories/tokens") as typeof import("@/test/factories/tokens");

describe("useAuthStore", () => {
  beforeEach(() => {
    mockStorage.clear();
    useAuthStore.setState({ accessToken: null, user: null, hydrated: false });
  });

  it("starts with null tokens and user, hydrated=false", () => {
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.hydrated).toBe(false);
  });

  it("login sets in-memory accessToken and user, persists tokens to SecureStore", async () => {
    const tokens = makeTokenPair();
    const user = makeUser();

    await useAuthStore.getState().login(tokens, user);

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe(tokens.accessToken);
    expect(state.user).toEqual(user);
    expect(await tokenStorage.getAccessToken()).toBe(tokens.accessToken);
    expect(await tokenStorage.getRefreshToken()).toBe(tokens.refreshToken);
  });

  it("logout clears in-memory state and SecureStore", async () => {
    const tokens = makeTokenPair();
    const user = makeUser();
    await useAuthStore.getState().login(tokens, user);

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(await tokenStorage.getAccessToken()).toBeNull();
    expect(await tokenStorage.getRefreshToken()).toBeNull();
  });

  it("hydrate loads accessToken from SecureStore into memory and sets hydrated=true", async () => {
    await tokenStorage.setAccessToken("persisted-access");
    await tokenStorage.setRefreshToken("persisted-refresh");

    await useAuthStore.getState().hydrate();

    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("persisted-access");
    expect(state.hydrated).toBe(true);
  });

  it("hydrate sets hydrated=true even when no token exists", async () => {
    await useAuthStore.getState().hydrate();
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.hydrated).toBe(true);
  });
});
