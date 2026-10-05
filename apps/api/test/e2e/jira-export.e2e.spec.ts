import request from "supertest";
import { INestApplication } from "@nestjs/common";
import type { Server } from "http";
import { createE2eApp } from "./helpers/app.js";
import { resetE2e } from "./helpers/reset.js";
import { makeWav } from "./helpers/wav.js";

const EMAIL = "e2e-export@example.com";
const LINKED_PROJECT = "Linked Project";
const UNLINKED_PROJECT = "Unlinked Project";
const JIRA_PROJECT_KEY = "YAP";
const POLL_TIMEOUT_MS = 20000;
const POLL_INTERVAL_MS = 500;

async function poll<T>(fn: () => Promise<T | undefined>): Promise<T> {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value !== undefined) return value;
    if (Date.now() - start > POLL_TIMEOUT_MS) throw new Error("poll timed out");
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

describe("Jira export", () => {
  let app: INestApplication;
  let http: Server;
  let token: string;

  const auth = (r: request.Test) => r.set("Authorization", `Bearer ${token}`);

  async function createProject(name: string, jiraProjectKey?: string): Promise<string> {
    const { body } = await auth(
      request(http)
        .post("/api/v1/projects")
        .send(jiraProjectKey ? { name, jiraProjectKey } : { name }),
    ).expect(201);
    return body.id as string;
  }

  async function uploadAndWaitForTickets(projectId: string): Promise<string[]> {
    const { body: recording } = await auth(
      request(http)
        .post("/api/v1/audio/upload")
        .query({ projectId })
        .attach("file", makeWav(), { filename: "export.wav", contentType: "audio/wav" }),
    ).expect(201);

    await poll(async () => {
      const { body } = await auth(request(http).get(`/api/v1/audio/${recording.id}`)).expect(200);
      if (body.status === "FAILED") {
        throw new Error(`audio processing failed: ${body.errorMessage}`);
      }
      return body.status === "COMPLETED" ? body : undefined;
    });

    const { body: tickets } = await auth(
      request(http).get("/api/v1/tickets").query({ projectId }),
    ).expect(200);
    return tickets.data.map((t: { id: string }) => t.id);
  }

  beforeAll(async () => {
    ({ app, http } = await createE2eApp());
    await resetE2e(app);

    await request(http).post("/api/v1/auth/request-otp").send({ email: EMAIL }).expect(201);
    const { body: otp } = await request(http)
      .get("/api/v1/auth/_test/last-otp")
      .query({ email: EMAIL })
      .expect(200);
    await request(http)
      .post("/api/v1/auth/verify-otp")
      .send({ email: EMAIL, code: otp.code })
      .expect(200);
    const { body: registered } = await request(http)
      .post("/api/v1/auth/complete-register")
      .send({ email: EMAIL, code: otp.code, name: "Export User" })
      .expect(201);
    token = registered.accessToken as string;

    await auth(
      request(http).post("/api/v1/integrations/jira/exchange").query({ code: "e2e-code" }),
    ).expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it("reports the connection the exchanged code created", async () => {
    const { body } = await auth(request(http).get("/api/v1/integrations/jira/status")).expect(200);

    expect(body.connected).toBe(true);
    expect(body.siteName).toBeTruthy();
  });

  it("exports a linked ticket and records its Jira key and url", async () => {
    const projectId = await createProject(LINKED_PROJECT, JIRA_PROJECT_KEY);
    const [ticketId] = await uploadAndWaitForTickets(projectId);

    const { body: issue } = await auth(
      request(http).post(`/api/v1/integrations/jira/export/${ticketId}`),
    ).expect(201);
    expect(issue.key).toMatch(new RegExp(`^${JIRA_PROJECT_KEY}-\\d+$`));

    const { body: ticket } = await auth(request(http).get(`/api/v1/tickets/${ticketId}`)).expect(
      200,
    );
    expect(ticket.status).toBe("EXPORTED");
    expect(ticket.jiraIssueKey).toBe(issue.key);
    expect(ticket.jiraIssueUrl).toContain(`/browse/${issue.key}`);
  });

  it("refuses a ticket whose project is not linked to Jira", async () => {
    const projectId = await createProject(UNLINKED_PROJECT);
    const [ticketId] = await uploadAndWaitForTickets(projectId);

    const { body } = await auth(
      request(http).post(`/api/v1/integrations/jira/export/${ticketId}`),
    ).expect(400);
    expect(body.message).toBe("Project not linked to a Jira project");
  });

  it("keeps exporting the rest of a bulk when one ticket fails", async () => {
    const linkedId = await createProject(`${LINKED_PROJECT} bulk`, JIRA_PROJECT_KEY);
    const unlinkedId = await createProject(`${UNLINKED_PROJECT} bulk`);
    const [linkedTicket] = await uploadAndWaitForTickets(linkedId);
    const [unlinkedTicket] = await uploadAndWaitForTickets(unlinkedId);

    const { body } = await auth(
      request(http)
        .post("/api/v1/integrations/jira/export-bulk")
        .send({ ticketIds: [linkedTicket, unlinkedTicket] }),
    ).expect(201);

    expect(body).toMatchObject({ exported: 1, failed: 1, total: 2 });

    const exported = body.results.find((r: { ticketId: string }) => r.ticketId === linkedTicket);
    const failed = body.results.find((r: { ticketId: string }) => r.ticketId === unlinkedTicket);
    expect(exported.jiraKey).toMatch(new RegExp(`^${JIRA_PROJECT_KEY}-\\d+$`));
    expect(failed.error).toBe("Project not linked to a Jira project");
  });
});
