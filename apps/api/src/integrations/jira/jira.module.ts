import { Module } from "@nestjs/common";
import { JiraService } from "./jira.service.js";
import { ExportService } from "./export.service.js";
import { JiraController } from "./jira.controller.js";
import { TicketsModule } from "../../tickets/tickets.module.js";
import { AnalyticsModule } from "../../analytics/analytics.module.js";

@Module({
  imports: [TicketsModule, AnalyticsModule],
  controllers: [JiraController],
  providers: [JiraService, ExportService],
  exports: [JiraService, ExportService],
})
export class JiraModule {}
