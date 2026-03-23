import { describe, it, expect, beforeEach, vi } from "vitest";
import { AudioGateway } from "./audio.gateway.js";

function createMockJwtService() {
  return {
    verifyAsync: vi.fn(),
  };
}

describe("AudioGateway", () => {
  let gateway: AudioGateway;
  let mockJwt: ReturnType<typeof createMockJwtService>;
  let mockServer: { to: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    mockJwt = createMockJwtService();
    gateway = new AudioGateway(mockJwt as never);
    mockServer = {
      to: vi.fn().mockReturnValue({
        emit: vi.fn(),
      }),
    };
    gateway.server = mockServer as never;
  });

  describe("handleConnection", () => {
    it("should authenticate client with valid JWT from auth.token", async () => {
      mockJwt.verifyAsync.mockResolvedValue({ sub: "user-1" });

      const mockClient = {
        id: "socket-1",
        handshake: {
          auth: { token: "valid-jwt" },
          headers: {},
        },
        data: {},
        join: vi.fn(),
        disconnect: vi.fn(),
      };

      await gateway.handleConnection(mockClient as never);

      expect(mockJwt.verifyAsync).toHaveBeenCalledWith("valid-jwt");
      expect(mockClient.join).toHaveBeenCalledWith("user:user-1");
      expect(mockClient.data.userId).toBe("user-1");
      expect(mockClient.disconnect).not.toHaveBeenCalled();
    });

    it("should authenticate client with JWT from authorization header", async () => {
      mockJwt.verifyAsync.mockResolvedValue({ sub: "user-2" });

      const mockClient = {
        id: "socket-2",
        handshake: {
          auth: {},
          headers: { authorization: "Bearer header-jwt" },
        },
        data: {},
        join: vi.fn(),
        disconnect: vi.fn(),
      };

      await gateway.handleConnection(mockClient as never);

      expect(mockJwt.verifyAsync).toHaveBeenCalledWith("header-jwt");
      expect(mockClient.join).toHaveBeenCalledWith("user:user-2");
    });

    it("should disconnect client with no token", async () => {
      const mockClient = {
        id: "socket-3",
        handshake: {
          auth: {},
          headers: {},
        },
        data: {},
        join: vi.fn(),
        disconnect: vi.fn(),
      };

      await gateway.handleConnection(mockClient as never);

      expect(mockClient.disconnect).toHaveBeenCalled();
      expect(mockClient.join).not.toHaveBeenCalled();
    });

    it("should disconnect client with invalid token", async () => {
      mockJwt.verifyAsync.mockRejectedValue(new Error("Invalid"));

      const mockClient = {
        id: "socket-4",
        handshake: {
          auth: { token: "bad-jwt" },
          headers: {},
        },
        data: {},
        join: vi.fn(),
        disconnect: vi.fn(),
      };

      await gateway.handleConnection(mockClient as never);

      expect(mockClient.disconnect).toHaveBeenCalled();
      expect(mockClient.join).not.toHaveBeenCalled();
    });
  });

  it("should emit progress event to user room", () => {
    gateway.emitProgress("user-1", "audio-1", "TRANSCRIBING");

    expect(mockServer.to).toHaveBeenCalledWith("user:user-1");
    expect(mockServer.to("user:user-1").emit).toHaveBeenCalledWith("audio:progress", {
      audioId: "audio-1",
      status: "TRANSCRIBING",
    });
  });

  it("should emit completed event with ticket count", () => {
    gateway.emitCompleted("user-1", "audio-1", 5);

    expect(mockServer.to).toHaveBeenCalledWith("user:user-1");
    expect(mockServer.to("user:user-1").emit).toHaveBeenCalledWith("audio:completed", {
      audioId: "audio-1",
      ticketCount: 5,
    });
  });

  it("should emit failed event with error message", () => {
    gateway.emitFailed("user-1", "audio-1", "OpenAI API error");

    expect(mockServer.to).toHaveBeenCalledWith("user:user-1");
    expect(mockServer.to("user:user-1").emit).toHaveBeenCalledWith("audio:failed", {
      audioId: "audio-1",
      error: "OpenAI API error",
    });
  });
});
