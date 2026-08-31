import request from "supertest";
import { INestApplication } from "@nestjs/common";
import type { Server } from "http";
import { createE2eApp } from "./helpers/app.js";
import { resetE2e } from "./helpers/reset.js";
import { makeWav } from "./helpers/wav.js";

const EMAIL = "e2e-user@example.com";

async function poll<T>(
  fn: () => Promise<T | undefined>,
  timeoutMs = 20000,
  intervalMs = 500,
): Promise<T> {
  const start = Date.now();
  for (;;) {
    const value = await fn();
    if (value !== undefined) return value;
    if (Date.now() - start > timeoutMs) throw new Error("poll timed out");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

describe("audio → ticket pipeline", () => {
  let app: INestApplication;
  let http: Server;

  beforeAll(async () => {
    ({ app, http } = await createE2eApp());
    await resetE2e(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it("registers, uploads audio, and produces tickets from the mocked AI", async () => {
    await request(http).post("/api/v1/auth/request-otp").send({ email: EMAIL }).expect(201);

    const { body: otp } = await request(http)
      .get("/api/v1/auth/_test/last-otp")
      .query({ email: EMAIL })
      .expect(200);
    expect(otp.code).toMatch(/^\d{4}$/);

    await request(http)
      .post("/api/v1/auth/verify-otp")
      .send({ email: EMAIL, code: otp.code })
      .expect(200);

    const { body: registered } = await request(http)
      .post("/api/v1/auth/complete-register")
      .send({ email: EMAIL, code: otp.code, name: "E2E User" })
      .expect(201);
    const token = registered.accessToken as string;
    expect(token).toBeTruthy();

    const auth = (r: request.Test) => r.set("Authorization", `Bearer ${token}`);

    const { body: project } = await auth(
      request(http).post("/api/v1/projects").send({ name: "E2E Project" }),
    ).expect(201);

    const { body: recording } = await auth(
      request(http)
        .post("/api/v1/audio/upload")
        .query({ projectId: project.id })
        .attach("file", makeWav(), { filename: "e2e.wav", contentType: "audio/wav" }),
    ).expect(201);
    expect(recording.id).toBeTruthy();

    await poll(async () => {
      const { body } = await auth(request(http).get(`/api/v1/audio/${recording.id}`)).expect(200);
      return body.status === "COMPLETED" ? body : undefined;
    });

    const { body: tickets } = await auth(
      request(http).get("/api/v1/tickets").query({ projectId: project.id }),
    ).expect(200);
    expect(tickets.total).toBeGreaterThanOrEqual(1);
    expect(tickets.data.map((t: { title: string }) => t.title)).toContain("Add login button");
  });
});
