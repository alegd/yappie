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

function createMockAnalyticsService() {
  return {
    track: vi.fn().mockResolvedValue({}),
  };
}

function createMockGateway() {
  return {
    emitProgress: vi.fn(),
    emitCompleted: vi.fn(),
    emitFailed: vi.fn(),
  };
}

function createMockStorageAdapter() {
  return {
    get: vi.fn(),
  };
}

function createMockPrisma() {
  return {
    audioRecording: {
      update: vi.fn().mockResolvedValue({}),
    },
  };
}

describe("AudioProcessor", () => {
  let processor: AudioProcessor;
  let mockAudioService: ReturnType<typeof createMockAudioService>;
  let mockAIService: ReturnType<typeof createMockAIService>;
  let mockTicketsService: ReturnType<typeof createMockTicketsService>;
  let mockProjectsService: ReturnType<typeof createMockProjectsService>;
  let mockAnalytics: ReturnType<typeof createMockAnalyticsService>;
  let mockGateway: ReturnType<typeof createMockGateway>;
  let mockStorage: ReturnType<typeof createMockStorageAdapter>;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockAudioService = createMockAudioService();
    mockAIService = createMockAIService();
    mockTicketsService = createMockTicketsService();
    mockProjectsService = createMockProjectsService();
    mockAnalytics = createMockAnalyticsService();
    mockGateway = createMockGateway();
    mockStorage = createMockStorageAdapter();
    mockPrisma = createMockPrisma();

    processor = new AudioProcessor(
      mockAudioService as never,
      mockAIService as never,
      mockTicketsService as never,
      mockProjectsService as never,
      mockAnalytics as never,
      mockGateway as never,
      mockStorage as never,
      mockPrisma as never,
    );
  });

  it("should run the full pipeline and emit WebSocket events", async () => {
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
    mockAIService.transcribe.mockResolvedValue({
      text: "We need auth and a dashboard",
      duration: 45.5,
    });
    mockAIService.decompose.mockResolvedValue([
      { title: "Auth", description: "Add authentication" },
      { title: "Dashboard", description: "Create dashboard" },
    ]);
    mockAIService.generateTickets.mockResolvedValue([
      { title: "Implement auth", description: "JWT auth flow", priority: "HIGH" },
      { title: "Build dashboard", description: "Main dashboard page", priority: "MEDIUM" },
    ]);
    mockAudioService.updateStatus.mockResolvedValue({});
    mockTicketsService.create
      .mockResolvedValueOnce({ id: "t-1" })
      .mockResolvedValueOnce({ id: "t-2" });

    await processor.process({
      data: { audioId: "audio-1", userId: "user-1" },
    } as never);

    // Verify pipeline ran
    expect(mockProjectsService.findOne).toHaveBeenCalledWith("proj-1", "user-1");
    expect(mockTicketsService.create).toHaveBeenCalledTimes(2);
    expect(mockTicketsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
    );

    // Verify analytics tracked per ticket
    expect(mockAnalytics.track).toHaveBeenCalledTimes(2);
    expect(mockAnalytics.track).toHaveBeenCalledWith("user-1", "ticket.generated", {
      audioId: "audio-1",
      ticketId: "t-1",
    });

    // Verify WebSocket events emitted
    expect(mockGateway.emitProgress).toHaveBeenCalledWith("user-1", "audio-1", "TRANSCRIBING");
    expect(mockGateway.emitProgress).toHaveBeenCalledWith("user-1", "audio-1", "ANALYZING");
    expect(mockGateway.emitCompleted).toHaveBeenCalledWith("user-1", "audio-1", 2);

    // Verify transcription and duration persisted
    expect(mockPrisma.audioRecording.update).toHaveBeenCalledWith({
      where: { id: "audio-1" },
      data: { transcription: "We need auth and a dashboard", duration: 45.5 },
    });
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
    mockAIService.transcribe.mockResolvedValue({ text: "Some task", duration: 12.3 });
    mockAIService.decompose.mockResolvedValue([]);
    mockAIService.generateTickets.mockResolvedValue([]);
    mockAudioService.updateStatus.mockResolvedValue({});

    await processor.process({
      data: { audioId: "audio-1", userId: "user-1" },
    } as never);

    expect(mockProjectsService.findOne).not.toHaveBeenCalled();
    expect(mockAIService.decompose).toHaveBeenCalledWith("Some task", undefined);
    expect(mockGateway.emitCompleted).toHaveBeenCalledWith("user-1", "audio-1", 0);
  });

  it("should emit failed event and set status to FAILED on error", async () => {
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
    expect(mockGateway.emitFailed).toHaveBeenCalledWith("user-1", "audio-1", "OpenAI API error");
  });
});
