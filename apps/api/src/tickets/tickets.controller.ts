import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { TicketsService } from "./tickets.service.js";

@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  findAll(
    @Query("page") page = "1",
    @Query("limit") limit = "10",
    @Query("status") status?: string,
    @Query("priority") priority?: string,
    @Query("projectId") projectId?: string,
  ) {
    return this.ticketsService.findAll({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      status,
      priority,
      projectId,
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() data: { title?: string; description?: string }) {
    return this.ticketsService.update(id, data);
  }

  @Post(":id/approve")
  @HttpCode(HttpStatus.OK)
  approve(@Param("id") id: string) {
    return this.ticketsService.approve(id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id") id: string) {
    return this.ticketsService.remove(id);
  }
}
