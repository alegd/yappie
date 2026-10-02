import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    data: { name: string; description?: string; context?: string; jiraProjectKey?: string },
  ) {
    return this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        context: data.context,
        jiraProjectKey: data.jiraProjectKey,
        userId,
      },
    });
  }

  async findAll(userId: string, pagination: { page: number; limit: number }) {
    const skip = (pagination.page - 1) * pagination.limit;

    const [rows, total] = await Promise.all([
      this.prisma.project.findMany({
        where: { userId },
        skip,
        take: pagination.limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { tickets: { where: { status: "DRAFT" } } } },
        },
      }),
      this.prisma.project.count({ where: { userId } }),
    ]);

    const data = rows.map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { _count, ...rest } = row as any;
      return { ...rest, pendingTicketCount: _count?.tickets ?? 0 };
    });

    return { data, total, page: pagination.page, limit: pagination.limit };
  }

  private assertOwnership<T extends { userId: string }>(project: T | null, userId: string): T {
    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    return project;
  }

  private async findOwned(id: string, userId: string) {
    const row = await this.prisma.project.findUnique({ where: { id } });

    return this.assertOwnership(row, userId);
  }

  async findOne(id: string, userId: string) {
    const row = await this.prisma.project.findUnique({
      where: { id },
      include: { _count: { select: { audioRecordings: true, tickets: true } } },
    });

    const { _count, ...project } = this.assertOwnership(row, userId);

    const exportedTicketCount = await this.prisma.ticket.count({
      where: { projectId: id, jiraIssueKey: { not: null } },
    });

    return {
      ...project,
      audioCount: _count.audioRecordings,
      ticketCount: _count.tickets,
      exportedTicketCount,
    };
  }

  async update(
    id: string,
    userId: string,
    data: { name?: string; description?: string; context?: string; jiraProjectKey?: string },
  ) {
    await this.findOwned(id, userId);

    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOwned(id, userId);

    return this.prisma.project.delete({ where: { id } });
  }
}
