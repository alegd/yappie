import { Global, Module } from "@nestjs/common";
import { QuotasService } from "./quotas.service.js";
import { AnalyticsModule } from "../analytics/analytics.module.js";

@Global()
@Module({
  imports: [AnalyticsModule],
  providers: [QuotasService],
  exports: [QuotasService],
})
export class QuotasModule {}
