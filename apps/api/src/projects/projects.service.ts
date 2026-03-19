import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { type PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: { name: string; description?: string }) {
    return this.prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        userId,
      },
    });
  }

  async findAll(userId: string, pagination: { page: number; limit: number }) {
    const skip = (pagination.page - 1) * pagination.limit;

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where: { userId },
        skip,
        take: pagination.limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.project.count({ where: { userId } }),
    ]);

    return { data, total, page: pagination.page, limit: pagination.limit };
  }

  async findOne(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });

    if (!project) {
      throw new NotFoundException("Project not found");
    }

    if (project.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    return project;
  }

  async update(id: string, userId: string, data: { name?: string; description?: string }) {
    await this.findOne(id, userId);

    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.project.delete({ where: { id } });
  }
}
