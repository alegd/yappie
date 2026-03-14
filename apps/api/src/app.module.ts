import { Module } from "@nestjs/common";
import { AppController } from "./app.controller.js";
import { AppService } from "./app.service.js";
import { AuthModule } from "./auth/auth.module.js";
import { AudioModule } from "./audio/audio.module.js";
import { TicketsModule } from "./tickets/tickets.module.js";
import { ProjectsModule } from "./projects/projects.module.js";
import { IntegrationsModule } from "./integrations/integrations.module.js";
import { AnalyticsModule } from "./analytics/analytics.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    AudioModule,
    TicketsModule,
    ProjectsModule,
    IntegrationsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
