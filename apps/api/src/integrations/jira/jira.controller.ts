import { ApiBearerAuth } from "@nestjs/swagger";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { JiraService } from "./jira.service.js";
import { ExportService } from "./export.service.js";
import { Public } from "../../auth/decorators/public.decorator.js";

@ApiBearerAuth()
@Controller("integrations/jira")
export class JiraController {
  constructor(
    private readonly jiraService: JiraService,
    private readonly exportService: ExportService,
  ) {}

  @Get("auth")
  getAuthUrl(@Req() req: { user: { sub: string } }) {
    return { url: this.jiraService.getAuthUrl(req.user.sub) };
  }

  @Public()
  @Get("callback")
  async callback(@Query("code") code: string, @Query("state") state: string, @Res() res: Response) {
    await this.jiraService.exchangeCode(code, state);
    const frontendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    return res.redirect(`${frontendUrl}/dashboard/settings?jira=connected`);
  }

  @Post("exchange")
  exchange(@Query("code") code: string, @Req() req: { user: { sub: string } }) {
    return this.jiraService.exchangeCode(code, req.user.sub);
  }

  @Get("projects")
  getProjects(@Req() req: { user: { sub: string } }) {
    return this.jiraService.getProjects(req.user.sub);
  }

  @Post("export/:ticketId")
  exportOne(
    @Param("ticketId") ticketId: string,
    @Query("projectKey") projectKey: string,
    @Req() req: { user: { sub: string } },
  ) {
    return this.exportService.exportOne(req.user.sub, ticketId, projectKey);
  }

  @Post("export-bulk")
  exportBulk(
    @Body() body: { ticketIds: string[]; projectKey: string },
    @Req() req: { user: { sub: string } },
  ) {
    return this.exportService.exportBulk(req.user.sub, body.ticketIds, body.projectKey);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  disconnect(@Req() req: { user: { sub: string } }) {
    return this.jiraService.disconnect(req.user.sub);
  }
}
