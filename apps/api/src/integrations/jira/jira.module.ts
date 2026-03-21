import { Module } from "@nestjs/common";
import { JiraService } from "./jira.service.js";
import { JiraController } from "./jira.controller.js";

@Module({
  controllers: [JiraController],
  providers: [JiraService],
  exports: [JiraService],
})
export class JiraModule {}
