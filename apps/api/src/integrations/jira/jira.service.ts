import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service.js";

interface CreateIssueInput {
  projectKey: string;
  summary: string;
  description: string;
  issueType: string;
}

@Injectable()
export class JiraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  getAuthUrl(): string {
    const clientId = this.config.get("JIRA_CLIENT_ID");
    const callbackUrl = encodeURIComponent(this.config.get("JIRA_CALLBACK_URL") || "");
    const scopes = encodeURIComponent(
      "read:jira-work write:jira-work read:jira-user offline_access",
    );

    return `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${clientId}&scope=${scopes}&redirect_uri=${callbackUrl}&response_type=code&prompt=consent`;
  }

  async exchangeCode(code: string, userId: string) {
    const tokenData = await this.postJson("https://auth.atlassian.com/oauth/token", {
      grant_type: "authorization_code",
      client_id: this.config.get("JIRA_CLIENT_ID"),
      client_secret: this.config.get("JIRA_CLIENT_SECRET"),
      code,
      redirect_uri: this.config.get("JIRA_CALLBACK_URL"),
    });

    const resources = await this.getJson(
      "https://api.atlassian.com/oauth/token/accessible-resources",
      tokenData.access_token,
    );

    const site = resources[0];

    return this.prisma.integration.upsert({
      where: { userId_type: { userId, type: "JIRA" } },
      create: {
        type: "JIRA",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        cloudId: site?.id,
        siteName: site?.name,
        userId,
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        cloudId: site?.id,
        siteName: site?.name,
      },
    });
  }

  async refreshAccessToken(userId: string) {
    const integration = await this.getIntegration(userId);

    const tokenData = await this.postJson("https://auth.atlassian.com/oauth/token", {
      grant_type: "refresh_token",
      client_id: this.config.get("JIRA_CLIENT_ID"),
      client_secret: this.config.get("JIRA_CLIENT_SECRET"),
      refresh_token: integration.refreshToken,
    });

    return this.prisma.integration.upsert({
      where: { userId_type: { userId, type: "JIRA" } },
      create: {
        type: "JIRA",
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        userId,
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      },
    });
  }

  async getProjects(userId: string) {
    const integration = await this.getIntegration(userId);

    return this.getJson(
      `https://api.atlassian.com/ex/jira/${integration.cloudId}/rest/api/3/project`,
      integration.accessToken,
    );
  }

  async createIssue(userId: string, input: CreateIssueInput) {
    const integration = await this.getIntegration(userId);

    try {
      return await this.postJson(
        `https://api.atlassian.com/ex/jira/${integration.cloudId}/rest/api/3/issue`,
        {
          fields: {
            project: { key: input.projectKey },
            summary: input.summary,
            description: {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [{ type: "text", text: input.description }],
                },
              ],
            },
            issuetype: { name: input.issueType },
          },
        },
        integration.accessToken,
      );
    } catch {
      throw new BadRequestException("Failed to create Jira issue");
    }
  }

  async disconnect(userId: string) {
    await this.prisma.integration.delete({
      where: { userId_type: { userId, type: "JIRA" } },
    });
  }

  private async getIntegration(userId: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { userId_type: { userId, type: "JIRA" } },
    });

    if (!integration) {
      throw new UnauthorizedException("Jira not connected. Please authorize first.");
    }

    return integration;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async postJson(url: string, body: unknown, token?: string): Promise<any> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return response.json();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getJson(url: string, token: string): Promise<any> {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return response.json();
  }
}
