import { Module } from "@nestjs/common";
import { AudioService } from "./audio.service.js";
import { AudioController } from "./audio.controller.js";

@Module({
  controllers: [AudioController],
  providers: [AudioService],
  exports: [AudioService],
})
export class AudioModule {}
