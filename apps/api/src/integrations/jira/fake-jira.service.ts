import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { ZodType } from "zod";
import { CacheService } from "../../common/cache.service.js";
import { CryptoService } from "../../crypto/crypto.service.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import { JiraService } from "./jira.service.js";

const FAKE_AUTHORIZATION_CODE = "e2e-authorization-code";
const FAKE_ACCESS_TOKEN = "e2e-access-token";
const FAKE_REFRESH_TOKEN = "e2e-refresh-token";
const FAKE_TOKEN_TTL_SECONDS = 3600;
const FAKE_CLOUD_ID = "e2e-cloud-id";
const FAKE_SITE_NAME = "e2e-site";
const FAKE_PROJECTS = [{ id: "10000", key: "YAP", name: "Yappie E2E" }];

const TOKEN_PATH = "/oauth/token";
const ACCESSIBLE_RESOURCES_PATH = "/oauth/token/accessible-resources";
const PROJECT_PATH = "/rest/api/3/project";
const ISSUE_PATH = "/rest/api/3/issue";

interface CreateIssueBody {
  fields: { project: { key: string } };
}

function readProjectKey(body: unknown): string {
  return (body as CreateIssueBody).fields.project.key;
}

@Injectable()
export class FakeJiraService extends JiraService {
  private readonly configService: ConfigService;
  private issuesCreated = 0;

  constructor(
    prisma: PrismaService,
    config: ConfigService,
    crypto: CryptoService,
    cache: CacheService,
  ) {
    super(prisma, config, crypto, cache);
    this.configService = config;
  }

  override getAuthUrl(userId: string, returnPath?: string): string {
    const url = new URL(this.configService.get<string>("JIRA_CALLBACK_URL")!);
    url.searchParams.set("code", FAKE_AUTHORIZATION_CODE);
    url.searchParams.set("state", returnPath ? `${userId}:${returnPath}` : userId);
    return url.toString();
  }

  protected override async postJson<T>(
    url: string,
    body: unknown,
    _token: string | undefined,
    schema: ZodType<T>,
  ): Promise<T> {
    if (url.includes(TOKEN_PATH)) {
      return schema.parse({
        access_token: FAKE_ACCESS_TOKEN,
        refresh_token: FAKE_REFRESH_TOKEN,
        expires_in: FAKE_TOKEN_TTL_SECONDS,
      });
    }

    if (url.endsWith(ISSUE_PATH)) {
      this.issuesCreated++;
      const key = `${readProjectKey(body)}-${this.issuesCreated}`;
      return schema.parse({ id: String(this.issuesCreated), key });
    }

    throw new Error(`FakeJiraService has no canned POST response for ${url}`);
  }

  protected override async getJson<T>(url: string, _token: string, schema: ZodType<T>): Promise<T> {
    if (url.includes(ACCESSIBLE_RESOURCES_PATH)) {
      return schema.parse([{ id: FAKE_CLOUD_ID, name: FAKE_SITE_NAME }]);
    }

    if (url.endsWith(PROJECT_PATH)) {
      return schema.parse(FAKE_PROJECTS);
    }

    throw new Error(`FakeJiraService has no canned GET response for ${url}`);
  }
}
