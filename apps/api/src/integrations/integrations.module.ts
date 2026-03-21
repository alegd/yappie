import { Module } from "@nestjs/common";
import { JiraModule } from "./jira/jira.module.js";

@Module({
  imports: [JiraModule],
})
export class IntegrationsModule {}
