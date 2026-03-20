import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { type PrismaService } from "../prisma/prisma.service.js";

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
  constructor(private readonly prisma: PrismaService) {}

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

    const filePath = `uploads/${userId}/${Date.now()}-${file.originalname}`;

    return this.prisma.audioRecording.create({
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

  async findAll(userId: string, pagination: { page: number; limit: number }) {
    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      this.prisma.audioRecording.findMany({
        where: { userId },
        skip,
        take: pagination.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.audioRecording.count({ where: { userId } }),
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
