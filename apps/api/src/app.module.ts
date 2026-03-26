import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { AuthModule } from "./auth/auth.module.js";
import { AudioModule } from "./audio/audio.module.js";
import { TicketsModule } from "./tickets/tickets.module.js";
import { ProjectsModule } from "./projects/projects.module.js";
import { IntegrationsModule } from "./integrations/integrations.module.js";
import { AnalyticsModule } from "./analytics/analytics.module.js";
import { UsersModule } from "./users/users.module.js";
import { TemplatesModule } from "./templates/templates.module.js";
import { QuotasModule } from "./quotas/quotas.module.js";
import { CommonModule } from "./common/common.module.js";
import { CryptoModule } from "./crypto/crypto.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { StorageModule } from "./storage/storage.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([
      { name: "short", ttl: 1000, limit: 3 },
      { name: "medium", ttl: 10000, limit: 20 },
      { name: "long", ttl: 60000, limit: 60 },
    ]),
    CommonModule,
    CryptoModule,
    PrismaModule,
    StorageModule,
    BullModule.forRoot({
      connection: (() => {
        const url = new URL(process.env.REDIS_URL || "redis://localhost:6379");
        return {
          host: url.hostname,
          port: parseInt(url.port || "6379", 10),
        };
      })(),
    }),
    AuthModule,
    AudioModule,
    TicketsModule,
    ProjectsModule,
    IntegrationsModule,
    AnalyticsModule,
    UsersModule,
    TemplatesModule,
    QuotasModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
