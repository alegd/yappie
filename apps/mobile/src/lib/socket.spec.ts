type Handler = (payload: { audioId: string }) => void;

const mockSocketInstance = {
  connected: false,
  handlers: new Map<string, Handler>(),
  on: jest.fn(function (event: string, handler: Handler) {
    mockSocketInstance.handlers.set(event, handler);
  }),
  disconnect: jest.fn(() => {
    mockSocketInstance.connected = false;
  }),
};

const mockIo = jest.fn(() => {
  mockSocketInstance.handlers = new Map();
  return mockSocketInstance;
});

jest.mock("socket.io-client", () => ({
  io: mockIo,
}));

const mockGetAccessToken = jest.fn();
jest.mock("./secure-store", () => ({
  getAccessToken: () => mockGetAccessToken(),
  getRefreshToken: jest.fn(),
  setAccessToken: jest.fn(),
  setRefreshToken: jest.fn(),
  clearTokens: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { QueryClient } = require("@tanstack/react-query") as typeof import("@tanstack/react-query");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { connectSocket, disconnectSocket } = require("./socket") as typeof import("./socket");

describe("socket client", () => {
  let queryClient: import("@tanstack/react-query").QueryClient;

  beforeEach(() => {
    mockIo.mockClear();
    mockSocketInstance.on.mockClear();
    mockSocketInstance.disconnect.mockClear();
    mockGetAccessToken.mockReset();
    disconnectSocket();
    queryClient = new QueryClient();
  });

  it("does not connect when there is no access token", async () => {
    mockGetAccessToken.mockResolvedValueOnce(null);
    const socket = await connectSocket(queryClient);
    expect(socket).toBeNull();
    expect(mockIo).not.toHaveBeenCalled();
  });

  it("connects with the access token in auth handshake", async () => {
    mockGetAccessToken.mockResolvedValueOnce("token-abc");
    await connectSocket(queryClient);
    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: { token: "token-abc" },
        transports: ["websocket"],
        reconnection: true,
      }),
    );
  });

  it("invalidates the specific audio query on audio:progress", async () => {
    mockGetAccessToken.mockResolvedValueOnce("token");
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    await connectSocket(queryClient);
    const handler = mockSocketInstance.handlers.get("audio:progress");
    handler?.({ audioId: "a1" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["audios", "a1"] });
  });

  it("invalidates audio + audios list + recent on audio:completed", async () => {
    mockGetAccessToken.mockResolvedValueOnce("token");
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    await connectSocket(queryClient);
    const handler = mockSocketInstance.handlers.get("audio:completed");
    handler?.({ audioId: "a1" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["audios", "a1"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["audios"] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["audios", "recent"] });
  });

  it("invalidates the audio on audio:failed", async () => {
    mockGetAccessToken.mockResolvedValueOnce("token");
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    await connectSocket(queryClient);
    const handler = mockSocketInstance.handlers.get("audio:failed");
    handler?.({ audioId: "a1" });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["audios", "a1"] });
  });

  it("disconnectSocket calls socket.disconnect", async () => {
    mockGetAccessToken.mockResolvedValueOnce("token");
    await connectSocket(queryClient);
    disconnectSocket();
    expect(mockSocketInstance.disconnect).toHaveBeenCalled();
  });
});
