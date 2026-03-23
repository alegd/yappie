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

function createMockProjectsService() {
  return {
    findOne: vi.fn(),
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
  let mockProjectsService: ReturnType<typeof createMockProjectsService>;
  let mockStorage: ReturnType<typeof createMockStorageAdapter>;

  beforeEach(() => {
    mockAudioService = createMockAudioService();
    mockAIService = createMockAIService();
    mockTicketsService = createMockTicketsService();
    mockProjectsService = createMockProjectsService();
    mockStorage = createMockStorageAdapter();

    processor = new AudioProcessor(
      mockAudioService as never,
      mockAIService as never,
      mockTicketsService as never,
      mockProjectsService as never,
      mockStorage as never,
    );
  });

  it("should run the full pipeline with project context", async () => {
    const audioBuffer = Buffer.from("fake-audio");
    mockStorage.get.mockResolvedValue(audioBuffer);
    mockAudioService.findOne.mockResolvedValue({
      id: "audio-1",
      filePath: "user-1/recording.mp3",
      fileName: "recording.mp3",
      userId: "user-1",
      projectId: "proj-1",
    });
    mockProjectsService.findOne.mockResolvedValue({
      id: "proj-1",
      name: "My App",
      context: "React + NestJS e-commerce app with Stripe payments",
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

    expect(mockProjectsService.findOne).toHaveBeenCalledWith("proj-1", "user-1");
    expect(mockAIService.decompose).toHaveBeenCalledWith(
      "We need auth and a dashboard",
      "React + NestJS e-commerce app with Stripe payments",
    );
    expect(mockAIService.generateTickets).toHaveBeenCalledWith(
      expect.any(Array),
      "React + NestJS e-commerce app with Stripe payments",
    );
    expect(mockTicketsService.create).toHaveBeenCalledTimes(2);
    expect(mockTicketsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
    );
    expect(mockAudioService.updateStatus).toHaveBeenCalledWith("audio-1", "COMPLETED");
  });

  it("should work without project context", async () => {
    mockStorage.get.mockResolvedValue(Buffer.from("audio"));
    mockAudioService.findOne.mockResolvedValue({
      id: "audio-1",
      filePath: "user-1/recording.mp3",
      fileName: "recording.mp3",
      userId: "user-1",
      projectId: null,
    });
    mockAIService.transcribe.mockResolvedValue("Some task");
    mockAIService.decompose.mockResolvedValue([]);
    mockAIService.generateTickets.mockResolvedValue([]);
    mockAudioService.updateStatus.mockResolvedValue({});

    await processor.process({
      data: { audioId: "audio-1", userId: "user-1" },
    } as never);

    expect(mockProjectsService.findOne).not.toHaveBeenCalled();
    expect(mockAIService.decompose).toHaveBeenCalledWith("Some task", undefined);
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
