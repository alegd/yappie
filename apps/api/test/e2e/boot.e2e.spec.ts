import request from "supertest";
import { INestApplication } from "@nestjs/common";
import type { Server } from "http";
import { createE2eApp } from "./helpers/app.js";
import { resetE2e } from "./helpers/reset.js";

describe("e2e boot", () => {
  let app: INestApplication;
  let http: Server;

  beforeAll(async () => {
    ({ app, http } = await createE2eApp());
    await resetE2e(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it("boots and enforces auth on a protected route", async () => {
    await request(http).get("/api/v1/tickets").expect(401);
  });
});
