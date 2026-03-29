import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { JiraService } from "./jira.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { AnalyticsService } from "../../analytics/analytics.service.js";

export interface ExportResult {
  ticketId: string;
  jiraKey?: string;
  error?: string;
}

@Injectable()
export class ExportService {
  constructor(
    private readonly jiraService: JiraService,
    private readonly prisma: PrismaService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async exportOne(userId: string, ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, userId },
      include: { project: true },
    });

    if (!ticket) {
      throw new NotFoundException("Ticket not found");
    }

    if (!ticket.projectId || !ticket.project) {
      throw new BadRequestException("Ticket is not assigned to a project");
    }

    if (!ticket.project.jiraProjectKey) {
      throw new BadRequestException("Project not linked to a Jira project");
    }

    const projectKey = ticket.project.jiraProjectKey;

    const jiraIssue = await this.jiraService.createIssue(userId, {
      projectKey,
      summary: ticket.title,
      description: ticket.description,
      issueType: "Task",
    });

    const jiraStatus = await this.jiraService.getStatus(userId);
    const browseUrl = `https://${jiraStatus.siteName}.atlassian.net/browse/${jiraIssue.key}`;

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        jiraIssueKey: jiraIssue.key,
        jiraIssueUrl: browseUrl,
        status: "EXPORTED",
      },
    });

    await this.analyticsService.track(userId, "ticket.exported", {
      ticketId,
      jiraKey: jiraIssue.key,
    });

    return jiraIssue;
  }

  async exportBulk(userId: string, ticketIds: string[]) {
    const results: ExportResult[] = [];
    let exported = 0;
    let failed = 0;

    for (const ticketId of ticketIds) {
      try {
        const jiraIssue = await this.exportOne(userId, ticketId);
        results.push({ ticketId, jiraKey: jiraIssue.key });
        exported++;
      } catch (error) {
        results.push({
          ticketId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        failed++;
      }
    }

    return { exported, failed, total: ticketIds.length, results };
  }
}
