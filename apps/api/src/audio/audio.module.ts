import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AudioService } from "./audio.service.js";
import { AudioController } from "./audio.controller.js";
import { AudioProcessor } from "./audio.processor.js";
import { AIModule } from "../ai/ai.module.js";
import { TicketsModule } from "../tickets/tickets.module.js";
import { ProjectsModule } from "../projects/projects.module.js";

@Module({
  imports: [
    BullModule.registerQueue({ name: "audio-processing" }),
    AIModule,
    TicketsModule,
    ProjectsModule,
  ],
  controllers: [AudioController],
  providers: [AudioService, AudioProcessor],
  exports: [AudioService],
})
export class AudioModule {}
