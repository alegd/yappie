import type { Plan } from ".prisma/client";

export interface QuotaInfo {
  plan: Plan;
  limitMinutes: number;
  usedMinutes: number;
  remainingMinutes: number;
  cycleStartDate: Date;
  cycleEndDate: Date;
}
