import { Module } from "@nestjs/common";
import { TicketsService } from "./tickets.service.js";
import { TicketsController } from "./tickets.controller.js";

@Module({
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
