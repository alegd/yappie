import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async track(userId: string, type: string, metadata?: Record<string, any>) {
    return this.prisma.usageEvent.create({
      data: { type, metadata, userId },
    });
  }

  async getOverview(userId: string, dateRange: { from: Date; to: Date }) {
    const results = await this.prisma.usageEvent.groupBy({
      by: ["type"],
      where: {
        userId,
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      _count: { type: true },
    });

    return results.map((r) => ({ type: r.type, count: r._count.type }));
  }

  async countByType(userId: string, type: string) {
    return this.prisma.usageEvent.count({
      where: { userId, type },
    });
  }
}
