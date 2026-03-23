import { ApiBearerAuth } from "@nestjs/swagger";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { TicketsService } from "./tickets.service.js";

@ApiBearerAuth()
@Controller("tickets")
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  findAll(
    @Req() req: { user: { sub: string } },
    @Query("page") page = "1",
    @Query("limit") limit = "10",
    @Query("status") status?: string,
    @Query("priority") priority?: string,
    @Query("projectId") projectId?: string,
  ) {
    return this.ticketsService.findAll({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      userId: req.user.sub,
      status,
      priority,
      projectId,
    });
  }

  @Get(":id")
  findOne(@Req() req: { user: { sub: string } }, @Param("id") id: string) {
    return this.ticketsService.findOne(id, req.user.sub);
  }

  @Patch(":id")
  update(
    @Req() req: { user: { sub: string } },
    @Param("id") id: string,
    @Body() data: { title?: string; description?: string },
  ) {
    return this.ticketsService.update(id, req.user.sub, data);
  }

  @Post(":id/approve")
  @HttpCode(HttpStatus.OK)
  approve(@Req() req: { user: { sub: string } }, @Param("id") id: string) {
    return this.ticketsService.approve(id, req.user.sub);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Req() req: { user: { sub: string } }, @Param("id") id: string) {
    return this.ticketsService.remove(id, req.user.sub);
  }
}
