import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, data: { name: string; content: string; isDefault?: boolean }) {
    return this.prisma.ticketTemplate.create({
      data: { ...data, userId },
    });
  }

  async findAll(userId: string) {
    return this.prisma.ticketTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string, userId: string) {
    const template = await this.prisma.ticketTemplate.findUnique({ where: { id } });

    if (!template) {
      throw new NotFoundException("Template not found");
    }

    if (template.userId !== userId) {
      throw new ForbiddenException("Access denied");
    }

    return template;
  }

  async update(
    id: string,
    userId: string,
    data: { name?: string; content?: string; isDefault?: boolean },
  ) {
    await this.findOne(id, userId);

    return this.prisma.ticketTemplate.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    return this.prisma.ticketTemplate.delete({ where: { id } });
  }

  async getDefault(userId: string) {
    return this.prisma.ticketTemplate.findFirst({
      where: { userId, isDefault: true },
    });
  }
}
