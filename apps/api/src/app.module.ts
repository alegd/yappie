import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { SentryModule } from "@sentry/nestjs/setup";
import { AnalyticsModule } from "./analytics/analytics.module.js";
import { BillingModule } from "./billing/billing.module.js";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { AudioModule } from "./audio/audio.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { CommonModule } from "./common/common.module.js";
import { CryptoModule } from "./crypto/crypto.module.js";
import { EmailModule } from "./email/email.module.js";
import { IntegrationsModule } from "./integrations/integrations.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { ProjectsModule } from "./projects/projects.module.js";
import { QuotasModule } from "./quotas/quotas.module.js";
import { RedisModule } from "./redis/redis.module.js";
import { StorageModule } from "./storage/storage.module.js";
import { TemplatesModule } from "./templates/templates.module.js";
import { TicketsModule } from "./tickets/tickets.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    SentryModule.forRoot(),
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
    RedisModule,
    EmailModule,
    BullModule.forRoot({
      connection: (() => {
        const url = new URL(process.env.REDIS_URL!);
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
    ...(process.env.STRIPE_SECRET_KEY ? [BillingModule] : []),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ...(process.env.NODE_ENV !== "test" ? [{ provide: APP_GUARD, useClass: ThrottlerGuard }] : []),
  ],
})
export class AppModule {}
