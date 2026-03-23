import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

interface CreateTicketData {
  title: string;
  description: string;
  priority?: string;
  audioRecordingId: string;
  projectId?: string;
  userId: string;
}

interface FindAllOptions {
  page: number;
  limit: number;
  userId: string;
  status?: string;
  priority?: string;
  projectId?: string;
}

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTicketData) {
    return this.prisma.ticket.create({
      data: {
        title: data.title,
        description: data.description,
        priority: (data.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
        audioRecordingId: data.audioRecordingId,
        projectId: data.projectId,
        userId: data.userId,
      },
    });
  }

  async findAll(options: FindAllOptions) {
    const skip = (options.page - 1) * options.limit;
    const where: Record<string, unknown> = { userId: options.userId };

    if (options.status) where.status = options.status;
    if (options.priority) where.priority = options.priority;
    if (options.projectId) where.projectId = options.projectId;

    const [data, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: options.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return { data, total, page: options.page, limit: options.limit };
  }

  async findOne(id: string, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });

    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }

    if (ticket.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    return ticket;
  }

  async update(
    id: string,
    userId: string,
    data: {
      title?: string;
      description?: string;
      priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    },
  ) {
    await this.findOne(id, userId);

    return this.prisma.ticket.update({
      where: { id },
      data,
    });
  }

  async approve(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.ticket.update({
      where: { id },
      data: { status: "APPROVED" },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.ticket.delete({ where: { id } });
  }
}
