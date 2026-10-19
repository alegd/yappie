/* eslint-disable @typescript-eslint/no-require-imports */
import type { ReactNode } from "react";

const mockSocketInstance = {
  connected: false,
  on: jest.fn(),
  disconnect: jest.fn(),
};

const mockIo = jest.fn(() => mockSocketInstance);

jest.mock("socket.io-client", () => ({
  io: mockIo,
}));

const mockGetAccessToken = jest.fn();
jest.mock("@/lib/secure-store", () => ({
  getAccessToken: () => mockGetAccessToken(),
  getRefreshToken: jest.fn(),
  setAccessToken: jest.fn(),
  setRefreshToken: jest.fn(),
  clearTokens: jest.fn(),
}));

const { act, renderHook, waitFor } =
  require("@testing-library/react-native") as typeof import("@testing-library/react-native");
const { QueryClient, QueryClientProvider } =
  require("@tanstack/react-query") as typeof import("@tanstack/react-query");
const { useAuthStore } =
  require("@/features/auth/auth-store") as typeof import("@/features/auth/auth-store");
const { useSocket } = require("@/hooks/use-socket") as typeof import("@/hooks/use-socket");
const { disconnectSocket } = require("@/lib/socket") as typeof import("@/lib/socket");

function createWrapper() {
  const queryClient = new QueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useSocket", () => {
  beforeEach(() => {
    mockIo.mockClear();
    mockSocketInstance.on.mockClear();
    mockSocketInstance.disconnect.mockClear();
    mockGetAccessToken.mockReset();
    mockGetAccessToken.mockResolvedValue("token-abc");
    disconnectSocket();
    useAuthStore.setState({ accessToken: null, user: null, hydrated: true });
  });

  it("opens a connection when the store holds an access token", async () => {
    useAuthStore.setState({ accessToken: "token-abc", hydrated: true });

    renderHook(() => useSocket(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ auth: { token: "token-abc" } }),
      );
    });
  });

  it("opens no connection while the store has no access token", async () => {
    renderHook(() => useSocket(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(mockGetAccessToken).not.toHaveBeenCalled();
    });
    expect(mockIo).not.toHaveBeenCalled();
  });

  it("closes the connection when the consumer unmounts", async () => {
    useAuthStore.setState({ accessToken: "token-abc", hydrated: true });

    const { unmount } = renderHook(() => useSocket(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(mockIo).toHaveBeenCalled();
    });

    unmount();

    expect(mockSocketInstance.disconnect).toHaveBeenCalled();
  });

  it("reconnects with the new token when the access token changes", async () => {
    useAuthStore.setState({ accessToken: "token-abc", hydrated: true });

    renderHook(() => useSocket(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(mockIo).toHaveBeenCalledTimes(1);
    });

    mockGetAccessToken.mockResolvedValue("token-xyz");
    act(() => {
      useAuthStore.setState({ accessToken: "token-xyz" });
    });

    await waitFor(() => {
      expect(mockIo).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.objectContaining({ auth: { token: "token-xyz" } }),
      );
    });
  });
});
