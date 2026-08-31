import { Test } from "@nestjs/testing";
import { EmailModule } from "./email.module.js";
import { EmailService } from "./email.service.js";
import { FakeEmailService } from "./fake-email.service.js";

describe("EmailModule provider swap", () => {
  const prev = process.env.E2E_TEST_ENDPOINTS;
  afterEach(() => {
    if (prev === undefined) {
      delete process.env.E2E_TEST_ENDPOINTS;
    } else {
      process.env.E2E_TEST_ENDPOINTS = prev;
    }
  });

  it("provides FakeEmailService for the EmailService token when E2E_TEST_ENDPOINTS=true", async () => {
    process.env.E2E_TEST_ENDPOINTS = "true";
    const moduleRef = await Test.createTestingModule({ imports: [EmailModule] }).compile();
    expect(moduleRef.get(EmailService)).toBeInstanceOf(FakeEmailService);
  });
});
