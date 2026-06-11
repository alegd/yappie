import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";

export type ActivityItem =
  | {
      type: "audio.uploaded";
      audioId: string;
      fileName: string;
      projectId: string | null;
      projectName: string | null;
      at: string;
    }
  | {
      type: "audio.completed";
      audioId: string;
      fileName: string;
      ticketCount: number;
      projectId: string | null;
      projectName: string | null;
      at: string;
    }
  | {
      type: "ticket.exported";
      ticketId: string;
      ticketTitle: string;
      jiraIssueKey: string;
      jiraIssueUrl: string | null;
      projectId: string | null;
      projectName: string | null;
      at: string;
    };

interface ActivityResponse {
  data: ActivityItem[];
  total: number;
}

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async findRecent(userId: string, limit: number): Promise<ActivityResponse> {
    const [uploaded, completed, exported] = await Promise.all([
      this.prisma.audioRecording.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: { project: { select: { name: true } } },
      }),
      this.prisma.audioRecording.findMany({
        where: { userId, status: "COMPLETED" },
        orderBy: { updatedAt: "desc" },
        take: limit,
        include: {
          project: { select: { name: true } },
          _count: { select: { tickets: true } },
        },
      }),
      this.prisma.ticket.findMany({
        where: { userId, status: "EXPORTED", jiraIssueKey: { not: null } },
        orderBy: { updatedAt: "desc" },
        take: limit,
        include: { project: { select: { name: true } } },
      }),
    ]);

    const items: ActivityItem[] = [
      ...uploaded.map(
        (a): ActivityItem => ({
          type: "audio.uploaded",
          audioId: a.id,
          fileName: a.fileName,
          projectId: a.projectId,
          projectName: a.project?.name ?? null,
          at: a.createdAt.toISOString(),
        }),
      ),
      ...completed.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (a: any): ActivityItem => ({
          type: "audio.completed",
          audioId: a.id,
          fileName: a.fileName,
          ticketCount: a._count?.tickets ?? 0,
          projectId: a.projectId,
          projectName: a.project?.name ?? null,
          at: a.updatedAt.toISOString(),
        }),
      ),
      ...exported.map(
        (t): ActivityItem => ({
          type: "ticket.exported",
          ticketId: t.id,
          ticketTitle: t.title,
          jiraIssueKey: t.jiraIssueKey!,
          jiraIssueUrl: t.jiraIssueUrl,
          projectId: t.projectId,
          projectName: t.project?.name ?? null,
          at: t.updatedAt.toISOString(),
        }),
      ),
    ];

    items.sort((a, b) => b.at.localeCompare(a.at));
    const data = items.slice(0, limit);

    return { data, total: data.length };
  }
}
