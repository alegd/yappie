import { Controller, Get, Query, Req } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { ActivityService } from "./activity.service.js";

@ApiBearerAuth()
@Controller("activity")
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  findRecent(@Req() req: { user: { sub: string } }, @Query("limit") limit = "10") {
    const parsed = parseInt(limit, 10);
    const clamped = Number.isNaN(parsed) ? 10 : Math.max(1, Math.min(parsed, 50));
    return this.activityService.findRecent(req.user.sub, clamped);
  }
}
