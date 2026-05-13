import { BadRequestException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ZodType } from "zod";
import { CacheService } from "../../common/cache.service.js";
import { CryptoService } from "../../crypto/crypto.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import {
  JiraAccessibleResourcesSchema,
  JiraIssueSchema,
  JiraProjectsSchema,
  JiraTokenResponseSchema,
} from "./jira.schemas.js";

const PROJECTS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface CreateIssueInput {
  projectKey: string;
  summary: string;
  description: string;
  issueType: string;
}

class JiraApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
  ) {
    super(`Jira request failed (${status})`);
  }
}

@Injectable()
export class JiraService {
  private readonly logger = new Logger(JiraService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly crypto: CryptoService,
    private readonly cache: CacheService,
  ) {}

  buildPostAuthRedirect(returnPath?: string): string {
    const frontendUrl = this.config.get("FRONTEND_URL");
    const defaultTarget = `${frontendUrl}/dashboard/settings?jira=connected`;

    if (!returnPath) return defaultTarget;
    if (returnPath.startsWith("yappie://")) return `${returnPath}?jira=connected`;
    if (returnPath.startsWith("/") && !returnPath.startsWith("//"))
      return `${frontendUrl}${returnPath}?jira=connected`;
    return defaultTarget;
  }

  getAuthUrl(userId: string, returnPath?: string): string {
    const clientId = this.config.get("JIRA_CLIENT_ID");
    const callbackUrl = encodeURIComponent(this.config.get("JIRA_CALLBACK_URL") || "");
    const scopes = encodeURIComponent(
      "read:jira-work write:jira-work read:jira-user offline_access",
    );
    const statePayload = returnPath ? `${userId}:${returnPath}` : userId;
    const state = encodeURIComponent(statePayload);

    return `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${clientId}&scope=${scopes}&redirect_uri=${callbackUrl}&response_type=code&prompt=consent&state=${state}`;
  }

  async exchangeCode(code: string, userId: string) {
    const tokenData = await this.callJira(
      () =>
        this.postJson(
          "https://auth.atlassian.com/oauth/token",
          {
            grant_type: "authorization_code",
            client_id: this.config.get("JIRA_CLIENT_ID"),
            client_secret: this.config.get("JIRA_CLIENT_SECRET"),
            code,
            redirect_uri: this.config.get("JIRA_CALLBACK_URL"),
          },
          undefined,
          JiraTokenResponseSchema,
        ),
      "Failed to authenticate with Jira",
    );

    const resources = await this.callJira(
      () =>
        this.getJson(
          "https://api.atlassian.com/oauth/token/accessible-resources",
          tokenData.access_token,
          JiraAccessibleResourcesSchema,
        ),
      "Failed to fetch Jira sites",
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

    const tokenData = await this.callJira(
      () =>
        this.postJson(
          "https://auth.atlassian.com/oauth/token",
          {
            grant_type: "refresh_token",
            client_id: this.config.get("JIRA_CLIENT_ID"),
            client_secret: this.config.get("JIRA_CLIENT_SECRET"),
            refresh_token: decryptedRefresh,
          },
          undefined,
          JiraTokenResponseSchema,
        ),
      "Failed to refresh Jira token",
    );

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

    const projects = await this.callJira(
      () =>
        this.getJson(
          `https://api.atlassian.com/ex/jira/${integration.cloudId}/rest/api/3/project`,
          integration.accessToken,
          JiraProjectsSchema,
        ),
      "Failed to fetch Jira projects",
    );

    this.cache.set(cacheKey, projects, PROJECTS_CACHE_TTL);
    return projects;
  }

  async createIssue(userId: string, input: CreateIssueInput) {
    const integration = await this.getIntegration(userId);

    return this.callJira(
      () =>
        this.postJson(
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
          JiraIssueSchema,
        ),
      "Failed to create Jira issue",
    );
  }

  private async callJira<T>(fn: () => Promise<T>, userMessage: string): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof JiraApiError) {
        this.logger.warn(`Jira API error (${err.status}): ${err.detail}`);
      } else {
        this.logger.warn(`Jira call failed: ${(err as Error).message}`);
      }
      throw new BadRequestException(userMessage);
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

  private async postJson<T>(
    url: string,
    body: unknown,
    token: string | undefined,
    schema: ZodType<T>,
  ): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new JiraApiError(response.status, detail);
    }

    const data = await response.json();
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      throw new Error(`Unexpected Jira response shape: ${parsed.error.message}`);
    }
    return parsed.data;
  }

  private async getJson<T>(url: string, token: string, schema: ZodType<T>): Promise<T> {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new JiraApiError(response.status, detail);
    }

    const data = await response.json();
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      throw new Error(`Unexpected Jira response shape: ${parsed.error.message}`);
    }
    return parsed.data;
  }
}
