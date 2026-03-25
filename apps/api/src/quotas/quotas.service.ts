import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service.js";
import { AnalyticsService } from "../analytics/analytics.service.js";
import { PLAN_LIMITS, CYCLE_DAYS } from "./quotas.constants.js";
import type { QuotaInfo } from "./dto/quota-info.dto.js";

@Injectable()
export class QuotasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async getQuota(userId: string): Promise<QuotaInfo> {
    const subscription = await this.getActiveSubscription(userId);
    const { cycleStart, cycleEnd } = this.calculateCycleBoundaries(subscription.startDate);
    const limitMinutes = this.getPlanLimit(subscription.plan);
    const usedSeconds = await this.getUsedSeconds(userId, cycleStart, cycleEnd);
    const usedMinutes = Math.floor(usedSeconds / 60);
    const remainingMinutes = Math.max(0, limitMinutes - usedMinutes);

    return {
      plan: subscription.plan,
      limitMinutes,
      usedMinutes,
      remainingMinutes,
      cycleStartDate: cycleStart,
      cycleEndDate: cycleEnd,
    };
  }

  async canUpload(userId: string): Promise<boolean> {
    const quota = await this.getQuota(userId);
    return quota.remainingMinutes > 0;
  }

  async trackConsumption(userId: string, audioId: string): Promise<void> {
    const recording = await this.prisma.audioRecording.findUnique({
      where: { id: audioId },
    });

    if (!recording || !recording.duration) return;

    const quota = await this.getQuota(userId);
    const usagePercentage = Math.round((quota.usedMinutes / quota.limitMinutes) * 100);

    await this.analyticsService.track(userId, "quota.consumed", {
      audioId,
      durationSeconds: recording.duration,
      durationMinutes: Math.floor(recording.duration / 60),
      usagePercentage,
      plan: quota.plan,
    });
  }

  // NOTE: Race condition possible if two requests create subscriptions concurrently.
  // For the MVP this is acceptable. A Prisma $transaction should be used when plan
  // upgrades are introduced (future Stripe integration).
  private async getActiveSubscription(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, endDate: null },
    });

    if (subscription) return subscription;

    return this.prisma.subscription.create({
      data: { userId, plan: "FREE" },
    });
  }

  private calculateCycleBoundaries(startDate: Date): { cycleStart: Date; cycleEnd: Date } {
    const now = new Date();
    const diffMs = now.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const cycleNumber = Math.floor(diffDays / CYCLE_DAYS);

    const cycleStart = new Date(
      startDate.getTime() + cycleNumber * CYCLE_DAYS * 24 * 60 * 60 * 1000,
    );
    const cycleEnd = new Date(cycleStart.getTime() + CYCLE_DAYS * 24 * 60 * 60 * 1000);

    return { cycleStart, cycleEnd };
  }

  private getPlanLimit(plan: string): number {
    const envKey = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];
    if (!envKey) throw new Error(`Unknown plan: ${plan}`);
    return this.configService.get<number>(envKey)!;
  }

  private async getUsedSeconds(userId: string, cycleStart: Date, cycleEnd: Date): Promise<number> {
    const result = await this.prisma.audioRecording.aggregate({
      where: {
        userId,
        status: "COMPLETED",
        duration: { not: null },
        createdAt: { gte: cycleStart, lt: cycleEnd },
      },
      _sum: { duration: true },
    });

    return result._sum.duration ?? 0;
  }
}
