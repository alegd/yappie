import request from "supertest";
import { INestApplication } from "@nestjs/common";
import type { Server } from "http";
import { createE2eApp } from "./helpers/app.js";
import { resetE2e } from "./helpers/reset.js";
import { makeWav } from "./helpers/wav.js";

const OWNER_EMAIL = "e2e-owner@example.com";
const STRANGER_EMAIL = "e2e-stranger@example.com";
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

describe("deleting a project", () => {
  let app: INestApplication;
  let http: Server;
  let ownerToken: string;
  let strangerToken: string;

  const asOwner = (r: request.Test) => r.set("Authorization", `Bearer ${ownerToken}`);
  const asStranger = (r: request.Test) => r.set("Authorization", `Bearer ${strangerToken}`);

  async function registerUser(email: string, name: string): Promise<string> {
    await request(http).post("/api/v1/auth/request-otp").send({ email }).expect(201);
    const { body: otp } = await request(http)
      .get("/api/v1/auth/_test/last-otp")
      .query({ email })
      .expect(200);
    await request(http).post("/api/v1/auth/verify-otp").send({ email, code: otp.code }).expect(200);
    const { body } = await request(http)
      .post("/api/v1/auth/complete-register")
      .send({ email, code: otp.code, name })
      .expect(201);
    return body.accessToken as string;
  }

  async function seedProjectWithAudioAndTickets() {
    const { body: project } = await asOwner(
      request(http).post("/api/v1/projects").send({ name: "Doomed Project" }),
    ).expect(201);

    const { body: recording } = await asOwner(
      request(http)
        .post("/api/v1/audio/upload")
        .query({ projectId: project.id })
        .attach("file", makeWav(), { filename: "doomed.wav", contentType: "audio/wav" }),
    ).expect(201);

    await poll(async () => {
      const { body } = await asOwner(request(http).get(`/api/v1/audio/${recording.id}`)).expect(
        200,
      );
      if (body.status === "FAILED") throw new Error(`processing failed: ${body.errorMessage}`);
      return body.status === "COMPLETED" ? body : undefined;
    });

    const { body: tickets } = await asOwner(
      request(http).get("/api/v1/tickets").query({ projectId: project.id }),
    ).expect(200);
    expect(tickets.data.length).toBeGreaterThan(0);

    return { projectId: project.id as string, audioId: recording.id as string, tickets };
  }

  beforeAll(async () => {
    ({ app, http } = await createE2eApp());
    await resetE2e(app);
    ownerToken = await registerUser(OWNER_EMAIL, "Owner");
    strangerToken = await registerUser(STRANGER_EMAIL, "Stranger");
  });

  afterAll(async () => {
    await app.close();
  });

  it("orphans the audio and its tickets instead of destroying them", async () => {
    const { projectId, audioId, tickets } = await seedProjectWithAudioAndTickets();
    const ticketId = tickets.data[0].id as string;

    await asOwner(request(http).delete(`/api/v1/projects/${projectId}`)).expect(204);

    await asOwner(request(http).get(`/api/v1/projects/${projectId}`)).expect(404);

    const { body: audio } = await asOwner(request(http).get(`/api/v1/audio/${audioId}`)).expect(
      200,
    );
    expect(audio.projectId).toBeNull();

    const { body: ticket } = await asOwner(request(http).get(`/api/v1/tickets/${ticketId}`)).expect(
      200,
    );
    expect(ticket.projectId).toBeNull();
  });

  it("refuses to delete a project owned by someone else, and leaves it alone", async () => {
    const { body: project } = await asOwner(
      request(http).post("/api/v1/projects").send({ name: "Not Yours" }),
    ).expect(201);

    await asStranger(request(http).delete(`/api/v1/projects/${project.id}`)).expect(403);

    await asOwner(request(http).get(`/api/v1/projects/${project.id}`)).expect(200);
  });
});
