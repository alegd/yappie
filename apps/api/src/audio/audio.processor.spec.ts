import { describe, it, expect, beforeEach, vi } from "vitest";
import { AudioProcessor } from "./audio.processor.js";

function createMockAudioService() {
  return {
    updateStatus: vi.fn(),
    findOne: vi.fn(),
  };
}

function createMockAIService() {
  return {
    transcribe: vi.fn(),
    decompose: vi.fn(),
    generateTickets: vi.fn(),
  };
}

function createMockTicketsService() {
  return {
    create: vi.fn(),
  };
}

function createMockStorageAdapter() {
  return {
    get: vi.fn(),
  };
}

describe("AudioProcessor", () => {
  let processor: AudioProcessor;
  let mockAudioService: ReturnType<typeof createMockAudioService>;
  let mockAIService: ReturnType<typeof createMockAIService>;
  let mockTicketsService: ReturnType<typeof createMockTicketsService>;
  let mockStorage: ReturnType<typeof createMockStorageAdapter>;

  beforeEach(() => {
    mockAudioService = createMockAudioService();
    mockAIService = createMockAIService();
    mockTicketsService = createMockTicketsService();
    mockStorage = createMockStorageAdapter();

    processor = new AudioProcessor(
      mockAudioService as never,
      mockAIService as never,
      mockTicketsService as never,
      mockStorage as never,
    );
  });

  it("should run the full pipeline: transcribe → decompose → generate → save", async () => {
    const audioBuffer = Buffer.from("fake-audio");
    mockStorage.get.mockResolvedValue(audioBuffer);
    mockAudioService.findOne.mockResolvedValue({
      id: "audio-1",
      filePath: "user-1/recording.mp3",
      fileName: "recording.mp3",
      userId: "user-1",
      projectId: "proj-1",
    });
    mockAIService.transcribe.mockResolvedValue("We need auth and a dashboard");
    mockAIService.decompose.mockResolvedValue([
      { title: "Auth", description: "Add authentication" },
      { title: "Dashboard", description: "Create dashboard" },
    ]);
    mockAIService.generateTickets.mockResolvedValue([
      { title: "Implement auth", description: "JWT auth flow", priority: "HIGH" },
      { title: "Build dashboard", description: "Main dashboard page", priority: "MEDIUM" },
    ]);
    mockAudioService.updateStatus.mockResolvedValue({});
    mockTicketsService.create.mockResolvedValue({});

    await processor.process({
      data: { audioId: "audio-1", userId: "user-1" },
    } as never);

    // Verify pipeline order
    expect(mockAudioService.updateStatus).toHaveBeenCalledWith("audio-1", "TRANSCRIBING");
    expect(mockAIService.transcribe).toHaveBeenCalledWith(audioBuffer, "recording.mp3");
    expect(mockAudioService.updateStatus).toHaveBeenCalledWith("audio-1", "ANALYZING");
    expect(mockAIService.decompose).toHaveBeenCalledWith("We need auth and a dashboard");
    expect(mockAIService.generateTickets).toHaveBeenCalled();
    expect(mockTicketsService.create).toHaveBeenCalledTimes(2);
    expect(mockAudioService.updateStatus).toHaveBeenCalledWith("audio-1", "COMPLETED");
  });

  it("should set status to FAILED on error", async () => {
    mockAudioService.findOne.mockResolvedValue({
      id: "audio-1",
      filePath: "user-1/recording.mp3",
      fileName: "recording.mp3",
      userId: "user-1",
    });
    mockStorage.get.mockResolvedValue(Buffer.from("audio"));
    mockAudioService.updateStatus.mockResolvedValue({});
    mockAIService.transcribe.mockRejectedValue(new Error("OpenAI API error"));

    await expect(
      processor.process({ data: { audioId: "audio-1", userId: "user-1" } } as never),
    ).rejects.toThrow("OpenAI API error");

    expect(mockAudioService.updateStatus).toHaveBeenCalledWith("audio-1", "FAILED");
  });
});
