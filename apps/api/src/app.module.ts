import { Module } from "@nestjs/common";
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
    PrismaModule,
    StorageModule,
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
      },
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
