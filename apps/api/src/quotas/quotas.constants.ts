import type { Plan } from ".prisma/client";

export const PLAN_LIMITS: Record<Plan, string> = {
  FREE: "QUOTA_FREE_MINUTES",
  PRO: "QUOTA_PRO_MINUTES",
};

export const CYCLE_DAYS = 30;
