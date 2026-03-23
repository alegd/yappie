import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "../prisma/prisma.service.js";
import { STORAGE_ADAPTER, StorageAdapter } from "../storage/storage.interface.js";
import { AnalyticsService } from "../analytics/analytics.service.js";

const ALLOWED_MIMETYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/flac",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

@Injectable()
export class AudioService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_ADAPTER) private readonly storage: StorageAdapter,
    @InjectQueue("audio-processing") private readonly audioQueue: Queue,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async upload(file: Express.Multer.File, userId: string, projectId?: string) {
    if (!ALLOWED_MIMETYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid audio format: ${file.mimetype}. Allowed: ${ALLOWED_MIMETYPES.join(", ")}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    const filePath = `${userId}/${Date.now()}-${file.originalname}`;

    // 1. Save file to storage
    await this.storage.save(filePath, file.buffer);

    // 2. Create DB record
    const recording = await this.prisma.audioRecording.create({
      data: {
        fileName: file.originalname,
        filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: "PENDING",
        userId,
        projectId,
      },
    });

    // 3. Enqueue processing job
    await this.audioQueue.add("process-audio", {
      audioId: recording.id,
      userId,
    });

    // 4. Track event
    await this.analyticsService.track(userId, "audio.uploaded", {
      audioId: recording.id,
      fileName: file.originalname,
      fileSize: file.size,
    });

    return recording;
  }

  async updateStatus(
    id: string,
    status: "PENDING" | "TRANSCRIBING" | "ANALYZING" | "COMPLETED" | "FAILED",
  ) {
    const recording = await this.prisma.audioRecording.findUnique({ where: { id } });

    if (!recording) {
      throw new NotFoundException("Audio recording not found");
    }

    return this.prisma.audioRecording.update({
      where: { id },
      data: { status },
    });
  }

  async findAll(userId: string, pagination: { page: number; limit: number }, projectId?: string) {
    const skip = (pagination.page - 1) * pagination.limit;
    const where: Record<string, unknown> = { userId };
    if (projectId) where.projectId = projectId;

    const [data, total] = await Promise.all([
      this.prisma.audioRecording.findMany({
        where,
        skip,
        take: pagination.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.audioRecording.count({ where }),
    ]);

    return { data, total, page: pagination.page, limit: pagination.limit };
  }

  async findOne(id: string, userId: string) {
    const recording = await this.prisma.audioRecording.findUnique({
      where: { id },
      include: { tickets: true },
    });

    if (!recording || recording.userId !== userId) {
      throw new NotFoundException("Audio recording not found");
    }

    return recording;
  }
}
