import { ApiBearerAuth } from "@nestjs/swagger";
import { Controller, Delete, Get, Post, Query, Req, HttpCode, HttpStatus } from "@nestjs/common";
import { JiraService } from "./jira.service.js";

@ApiBearerAuth()
@Controller("integrations/jira")
export class JiraController {
  constructor(private readonly jiraService: JiraService) {}

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

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  disconnect(@Req() req: { user: { sub: string } }) {
    return this.jiraService.disconnect(req.user.sub);
  }
}
