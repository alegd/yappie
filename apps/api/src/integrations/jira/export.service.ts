import { Injectable } from "@nestjs/common";
import { JiraService } from "./jira.service.js";
import { TicketsService } from "../../tickets/tickets.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";

export interface ExportResult {
  ticketId: string;
  jiraKey?: string;
  error?: string;
}

@Injectable()
export class ExportService {
  constructor(
    private readonly jiraService: JiraService,
    private readonly ticketsService: TicketsService,
    private readonly prisma: PrismaService,
  ) {}

  async exportOne(userId: string, ticketId: string, projectKey: string) {
    const ticket = await this.ticketsService.findOne(ticketId, userId);

    const jiraIssue = await this.jiraService.createIssue(userId, {
      projectKey,
      summary: ticket.title,
      description: ticket.description,
      issueType: "Task",
    });

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        jiraIssueKey: jiraIssue.key,
        jiraIssueUrl: jiraIssue.self,
        status: "EXPORTED",
      },
    });

    return jiraIssue;
  }

  async exportBulk(userId: string, ticketIds: string[], projectKey: string) {
    const results: ExportResult[] = [];
    let exported = 0;
    let failed = 0;

    for (const ticketId of ticketIds) {
      try {
        const jiraIssue = await this.exportOne(userId, ticketId, projectKey);
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
