import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CacheService } from "../../common/cache.service.js";
import { CryptoService } from "../../crypto/crypto.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { JiraService } from "./jira.service.js";
import { FakeJiraService } from "./fake-jira.service.js";
import { ExportService } from "./export.service.js";
import { JiraController } from "./jira.controller.js";
import { AnalyticsModule } from "../../analytics/analytics.module.js";

@Module({
  imports: [AnalyticsModule],
  controllers: [JiraController],
  providers: [
    {
      provide: JiraService,
      useFactory: (
        prisma: PrismaService,
        config: ConfigService,
        crypto: CryptoService,
        cache: CacheService,
      ) => {
        if (process.env.E2E_MOCK_JIRA === "true") {
          return new FakeJiraService(prisma, config, crypto, cache);
        }
        return new JiraService(prisma, config, crypto, cache);
      },
      inject: [PrismaService, ConfigService, CryptoService, CacheService],
    },
    ExportService,
  ],
  exports: [JiraService, ExportService],
})
export class JiraModule {}
