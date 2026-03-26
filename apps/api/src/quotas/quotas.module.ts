import { Global, Module } from "@nestjs/common";
import { QuotasService } from "./quotas.service.js";
import { QuotasController } from "./quotas.controller.js";
import { AnalyticsModule } from "../analytics/analytics.module.js";

@Global()
@Module({
  imports: [AnalyticsModule],
  controllers: [QuotasController],
  providers: [QuotasService],
  exports: [QuotasService],
})
export class QuotasModule {}
