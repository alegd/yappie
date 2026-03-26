import { Controller, Get, Req } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";
import { QuotasService } from "./quotas.service.js";

@ApiBearerAuth()
@Controller("quotas")
export class QuotasController {
  constructor(private readonly quotasService: QuotasService) {}

  @Get()
  getQuota(@Req() req: { user: { sub: string } }) {
    return this.quotasService.getQuota(req.user.sub);
  }
}
