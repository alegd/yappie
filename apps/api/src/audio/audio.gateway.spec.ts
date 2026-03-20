import { describe, it, expect, beforeEach, vi } from "vitest";
import { AudioGateway } from "./audio.gateway.js";

describe("AudioGateway", () => {
  let gateway: AudioGateway;
  let mockServer: { to: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    gateway = new AudioGateway();
    mockServer = {
      to: vi.fn().mockReturnValue({
        emit: vi.fn(),
      }),
    };
    gateway.server = mockServer as never;
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
