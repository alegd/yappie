import { describe, it, expect, beforeEach, vi } from "vitest";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { AudioService } from "./audio.service.js";
import { QuotaExceededException } from "../quotas/quota-exceeded.exception.js";

function createMockPrisma() {
  return {
    audioRecording: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
    project: {
      findFirst: vi.fn(),
    },
  };
}

function createMockStorage() {
  return {
    save: vi.fn().mockResolvedValue("/uploads/user-1/recording.mp3"),
    get: vi.fn(),
    delete: vi.fn(),
  };
}

function createMockQueue() {
  return {
    add: vi.fn().mockResolvedValue({ id: "job-1" }),
  };
}

function createMockAnalyticsService() {
  return {
    track: vi.fn().mockResolvedValue({}),
  };
}

function createMockQuotasService() {
  return {
    canUpload: vi.fn().mockResolvedValue(true),
  };
}

function createMockFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: "file",
    originalname: "recording.mp3",
    encoding: "7bit",
    mimetype: "audio/mpeg",
    size: 1024 * 1024, // 1MB
    buffer: Buffer.from("fake-audio"),
    destination: "",
    filename: "",
    path: "",
    stream: null as never,
    ...overrides,
  };
}

describe("AudioService", () => {
  let service: AudioService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;
  let mockStorage: ReturnType<typeof createMockStorage>;
  let mockQueue: ReturnType<typeof createMockQueue>;
  let mockAnalytics: ReturnType<typeof createMockAnalyticsService>;
  let mockQuotas: ReturnType<typeof createMockQuotasService>;

  const userId = "user-1";

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    mockStorage = createMockStorage();
    mockQueue = createMockQueue();
    mockAnalytics = createMockAnalyticsService();
    mockQuotas = createMockQuotasService();
    service = new AudioService(
      mockPrisma as never,
      mockStorage as never,
      mockQueue as never,
      mockAnalytics as never,
      mockQuotas as never,
    );
  });

  describe("upload", () => {
    const projectId = "project-1";

    it("should save file, create record, and enqueue job", async () => {
      const file = createMockFile();
      mockPrisma.project.findFirst.mockResolvedValue({ id: projectId, userId });
      mockPrisma.audioRecording.create.mockResolvedValue({
        id: "audio-1",
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: "PENDING",
        userId,
      });

      const result = await service.upload(file, userId, projectId);

      expect(result).toHaveProperty("id", "audio-1");
      expect(result.status).toBe("PENDING");
      // File saved to storage
      expect(mockStorage.save).toHaveBeenCalledWith(
        expect.stringContaining("user-1/"),
        file.buffer,
      );
      // Job enqueued with retry config
      expect(mockQueue.add).toHaveBeenCalledWith(
        "process-audio",
        { audioId: "audio-1", userId },
        expect.objectContaining({
          attempts: 3,
          backoff: { type: "exponential", delay: 5000 },
        }),
      );
    });

    it("should reject upload with invalid projectId", async () => {
      mockPrisma.project.findFirst.mockResolvedValue(null);
      const file = createMockFile();

      await expect(service.upload(file, userId, "invalid-project")).rejects.toThrow(
        BadRequestException,
      );
      expect(mockStorage.save).not.toHaveBeenCalled();
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it("should reject invalid audio format", async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: projectId, userId });
      const file = createMockFile({ mimetype: "text/plain", originalname: "notes.txt" });

      await expect(service.upload(file, userId, projectId)).rejects.toThrow(BadRequestException);
      expect(mockStorage.save).not.toHaveBeenCalled();
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it("should reject files exceeding size limit (50MB)", async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: projectId, userId });
      const file = createMockFile({ size: 51 * 1024 * 1024 });

      await expect(service.upload(file, userId, projectId)).rejects.toThrow(BadRequestException);
      expect(mockStorage.save).not.toHaveBeenCalled();
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it("should throw QuotaExceededException when quota is exceeded", async () => {
      mockPrisma.project.findFirst.mockResolvedValue({ id: projectId, userId });
      mockQuotas.canUpload.mockResolvedValue(false);
      const file = createMockFile();

      await expect(service.upload(file, userId, projectId)).rejects.toThrow(QuotaExceededException);
      expect(mockStorage.save).not.toHaveBeenCalled();
      expect(mockQueue.add).not.toHaveBeenCalled();
    });
  });

  describe("status transitions", () => {
    const mockRecording = {
      id: "audio-1",
      status: "PENDING",
      userId,
    };

    it("should transition from PENDING to TRANSCRIBING", async () => {
      mockPrisma.audioRecording.findUnique.mockResolvedValue(mockRecording);
      mockPrisma.audioRecording.update.mockResolvedValue({
        ...mockRecording,
        status: "TRANSCRIBING",
      });

      const result = await service.updateStatus("audio-1", "TRANSCRIBING");

      expect(result.status).toBe("TRANSCRIBING");
    });

    it("should transition from TRANSCRIBING to ANALYZING", async () => {
      mockPrisma.audioRecording.findUnique.mockResolvedValue({
        ...mockRecording,
        status: "TRANSCRIBING",
      });
      mockPrisma.audioRecording.update.mockResolvedValue({
        ...mockRecording,
        status: "ANALYZING",
      });

      const result = await service.updateStatus("audio-1", "ANALYZING");

      expect(result.status).toBe("ANALYZING");
    });

    it("should transition from ANALYZING to COMPLETED", async () => {
      mockPrisma.audioRecording.findUnique.mockResolvedValue({
        ...mockRecording,
        status: "ANALYZING",
      });
      mockPrisma.audioRecording.update.mockResolvedValue({
        ...mockRecording,
        status: "COMPLETED",
      });

      const result = await service.updateStatus("audio-1", "COMPLETED");

      expect(result.status).toBe("COMPLETED");
    });

    it("should transition to FAILED from any status", async () => {
      mockPrisma.audioRecording.findUnique.mockResolvedValue({
        ...mockRecording,
        status: "TRANSCRIBING",
      });
      mockPrisma.audioRecording.update.mockResolvedValue({
        ...mockRecording,
        status: "FAILED",
      });

      const result = await service.updateStatus("audio-1", "FAILED");

      expect(result.status).toBe("FAILED");
    });

    it("should throw NotFoundException for non-existent recording", async () => {
      mockPrisma.audioRecording.findUnique.mockResolvedValue(null);

      await expect(service.updateStatus("non-existent", "TRANSCRIBING")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findAll", () => {
    it("should return paginated recordings for a user", async () => {
      mockPrisma.audioRecording.findMany.mockResolvedValue([]);
      mockPrisma.audioRecording.count.mockResolvedValue(0);

      const result = await service.findAll(userId, { page: 1, limit: 10 });

      expect(result).toHaveProperty("data");
      expect(result).toHaveProperty("total", 0);
    });
  });

  describe("findOne", () => {
    it("should return a recording by id", async () => {
      mockPrisma.audioRecording.findUnique.mockResolvedValue({
        id: "audio-1",
        userId,
      });

      const result = await service.findOne("audio-1", userId);

      expect(result.id).toBe("audio-1");
    });

    it("should throw NotFoundException if not found", async () => {
      mockPrisma.audioRecording.findUnique.mockResolvedValue(null);

      await expect(service.findOne("non-existent", userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe("delete", () => {
    it("should delete the storage file and the DB row when the user owns the recording", async () => {
      mockPrisma.audioRecording.findUnique.mockResolvedValue({
        id: "audio-1",
        userId,
        filePath: "user-1/123-recording.mp3",
      });

      await service.delete("audio-1", userId);

      expect(mockStorage.delete).toHaveBeenCalledWith("user-1/123-recording.mp3");
      expect(mockPrisma.audioRecording.delete).toHaveBeenCalledWith({
        where: { id: "audio-1" },
      });
    });

    it("should throw NotFoundException when the recording does not exist", async () => {
      mockPrisma.audioRecording.findUnique.mockResolvedValue(null);

      await expect(service.delete("non-existent", userId)).rejects.toThrow(NotFoundException);
      expect(mockStorage.delete).not.toHaveBeenCalled();
      expect(mockPrisma.audioRecording.delete).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException when the recording belongs to another user", async () => {
      mockPrisma.audioRecording.findUnique.mockResolvedValue({
        id: "audio-1",
        userId: "someone-else",
        filePath: "someone-else/123-recording.mp3",
      });

      await expect(service.delete("audio-1", userId)).rejects.toThrow(NotFoundException);
      expect(mockStorage.delete).not.toHaveBeenCalled();
      expect(mockPrisma.audioRecording.delete).not.toHaveBeenCalled();
    });

    it("should still delete the DB row if storage deletion fails", async () => {
      mockPrisma.audioRecording.findUnique.mockResolvedValue({
        id: "audio-1",
        userId,
        filePath: "user-1/missing.mp3",
      });
      mockStorage.delete.mockRejectedValue(new Error("File not found on disk"));

      await service.delete("audio-1", userId);

      expect(mockPrisma.audioRecording.delete).toHaveBeenCalledWith({
        where: { id: "audio-1" },
      });
    });
  });
});
