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
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { JiraService } from "./jira.service.js";
import { ExportService } from "./export.service.js";

@ApiBearerAuth()
@Controller("integrations/jira")
export class JiraController {
  constructor(
    private readonly jiraService: JiraService,
    private readonly exportService: ExportService,
  ) {}

  @Get("auth")
  getAuthUrl() {
    return { url: this.jiraService.getAuthUrl() };
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
