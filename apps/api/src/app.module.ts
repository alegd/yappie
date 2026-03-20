import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { AuthModule } from "./auth/auth.module.js";
import { AudioModule } from "./audio/audio.module.js";
import { TicketsModule } from "./tickets/tickets.module.js";
import { ProjectsModule } from "./projects/projects.module.js";
import { IntegrationsModule } from "./integrations/integrations.module.js";
import { AnalyticsModule } from "./analytics/analytics.module.js";
import { UsersModule } from "./users/users.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { StorageModule } from "./storage/storage.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", "../../.env"],
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
