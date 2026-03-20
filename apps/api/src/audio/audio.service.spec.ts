import { describe, it, expect, beforeEach, vi } from "vitest";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { AudioService } from "./audio.service.js";

function createMockPrisma() {
  return {
    audioRecording: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
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

  const userId = "user-1";

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    service = new AudioService(mockPrisma as never);
  });

  describe("upload", () => {
    it("should create an audio recording with valid file", async () => {
      const file = createMockFile();
      mockPrisma.audioRecording.create.mockResolvedValue({
        id: "audio-1",
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: "PENDING",
        userId,
      });

      const result = await service.upload(file, userId);

      expect(result).toHaveProperty("id", "audio-1");
      expect(result.status).toBe("PENDING");
      expect(mockPrisma.audioRecording.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fileName: "recording.mp3",
            mimeType: "audio/mpeg",
            userId,
          }),
        }),
      );
    });

    it("should reject invalid audio format", async () => {
      const file = createMockFile({ mimetype: "text/plain", originalname: "notes.txt" });

      await expect(service.upload(file, userId)).rejects.toThrow(BadRequestException);
    });

    it("should reject files exceeding size limit (50MB)", async () => {
      const file = createMockFile({ size: 51 * 1024 * 1024 });

      await expect(service.upload(file, userId)).rejects.toThrow(BadRequestException);
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
      expect(mockPrisma.audioRecording.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
        }),
      );
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
});
