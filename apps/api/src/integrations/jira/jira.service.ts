import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CacheService } from "../../common/cache.service.js";
import { CryptoService } from "../../crypto/crypto.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";

const PROJECTS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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
    private readonly crypto: CryptoService,
    private readonly cache: CacheService,
  ) {}

  getAuthUrl(userId: string): string {
    const clientId = this.config.get("JIRA_CLIENT_ID");
    const callbackUrl = encodeURIComponent(this.config.get("JIRA_CALLBACK_URL") || "");
    const scopes = encodeURIComponent(
      "read:jira-work write:jira-work read:jira-user offline_access",
    );
    const state = encodeURIComponent(userId);

    return `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${clientId}&scope=${scopes}&redirect_uri=${callbackUrl}&response_type=code&prompt=consent&state=${state}`;
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

    const encryptedAccess = this.crypto.encrypt(tokenData.access_token);
    const encryptedRefresh = this.crypto.encrypt(tokenData.refresh_token);

    return this.prisma.integration.upsert({
      where: { userId_type: { userId, type: "JIRA" } },
      create: {
        type: "JIRA",
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        cloudId: site?.id,
        siteName: site?.name,
        userId,
      },
      update: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        cloudId: site?.id,
        siteName: site?.name,
      },
    });
  }

  async refreshAccessToken(userId: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { userId_type: { userId, type: "JIRA" } },
    });

    if (!integration || !integration.refreshToken) {
      throw new UnauthorizedException("Jira not connected. Please authorize first.");
    }

    const decryptedRefresh = this.crypto.decrypt(integration.refreshToken);

    const tokenData = await this.postJson("https://auth.atlassian.com/oauth/token", {
      grant_type: "refresh_token",
      client_id: this.config.get("JIRA_CLIENT_ID"),
      client_secret: this.config.get("JIRA_CLIENT_SECRET"),
      refresh_token: decryptedRefresh,
    });

    const encryptedAccess = this.crypto.encrypt(tokenData.access_token);
    const encryptedRefresh = this.crypto.encrypt(tokenData.refresh_token);

    return this.prisma.integration.upsert({
      where: { userId_type: { userId, type: "JIRA" } },
      create: {
        type: "JIRA",
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        userId,
      },
      update: {
        accessToken: encryptedAccess,
        refreshToken: encryptedRefresh,
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      },
    });
  }

  async getProjects(userId: string) {
    const cacheKey = `jira:projects:${userId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const integration = await this.getIntegration(userId);

    const projects = await this.getJson(
      `https://api.atlassian.com/ex/jira/${integration.cloudId}/rest/api/3/project`,
      integration.accessToken,
    );

    this.cache.set(cacheKey, projects, PROJECTS_CACHE_TTL);
    return projects;
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

  async getStatus(userId: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { userId_type: { userId, type: "JIRA" } },
      select: { id: true, siteName: true, cloudId: true, createdAt: true },
    });

    return {
      connected: !!integration,
      siteName: integration?.siteName || null,
      connectedAt: integration?.createdAt || null,
    };
  }

  async disconnect(userId: string) {
    await this.prisma.integration.delete({
      where: { userId_type: { userId, type: "JIRA" } },
    });
    this.cache.invalidate(`jira:projects:${userId}`);
  }

  private async getIntegration(userId: string) {
    const integration = await this.prisma.integration.findUnique({
      where: { userId_type: { userId, type: "JIRA" } },
    });

    if (!integration) {
      throw new UnauthorizedException("Jira not connected. Please authorize first.");
    }

    // Auto-refresh if token expired or about to expire (1 min buffer)
    if (integration.tokenExpiresAt && integration.tokenExpiresAt.getTime() < Date.now() + 60_000) {
      const refreshed = await this.refreshAccessToken(userId);
      return { ...refreshed, accessToken: this.crypto.decrypt(refreshed.accessToken) };
    }

    return { ...integration, accessToken: this.crypto.decrypt(integration.accessToken) };
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
