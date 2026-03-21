import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, Get, Query, Req } from "@nestjs/common";
import { AnalyticsService } from "./analytics.service.js";

@ApiBearerAuth()
@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("overview")
  getOverview(
    @Req() req: { user: { sub: string } },
    @Query("from") from: string,
    @Query("to") to: string,
  ) {
    return this.analyticsService.getOverview(req.user.sub, {
      from: new Date(from),
      to: new Date(to),
    });
  }

  @Get("count")
  countByType(@Req() req: { user: { sub: string } }, @Query("type") type: string) {
    return this.analyticsService.countByType(req.user.sub, type);
  }
}
