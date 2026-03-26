import { Injectable } from "@nestjs/common";
import { CacheService } from "../common/cache.service.js";
import { PrismaService } from "../prisma/prisma.service.js";

const OVERVIEW_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async track(userId: string, type: string, metadata?: Record<string, any>) {
    // Invalidate analytics cache when new event is tracked
    this.cache.invalidate(`analytics:${userId}:`);

    return this.prisma.usageEvent.create({
      data: { type, metadata, userId },
    });
  }

  async getOverview(userId: string, dateRange: { from: Date; to: Date }) {
    const cacheKey = `analytics:${userId}:${dateRange.from.toISOString()}:${dateRange.to.toISOString()}`;
    const cached = this.cache.get<Array<{ type: string; count: number }>>(cacheKey);
    if (cached) return cached;

    const results = await this.prisma.usageEvent.groupBy({
      by: ["type"],
      where: {
        userId,
        createdAt: { gte: dateRange.from, lte: dateRange.to },
      },
      _count: { type: true },
    });

    const overview = results.map((r) => ({ type: r.type, count: r._count.type }));
    this.cache.set(cacheKey, overview, OVERVIEW_CACHE_TTL);

    return overview;
  }

  async countByType(userId: string, type: string) {
    return this.prisma.usageEvent.count({
      where: { userId, type },
    });
  }
}
