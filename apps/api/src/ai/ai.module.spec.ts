import { Test } from "@nestjs/testing";
import { AIModule } from "./ai.module.js";
import { AIService } from "./ai.service.js";
import { FakeAIService } from "./fake-ai.service.js";

describe("AIModule provider swap", () => {
  const prev = process.env.E2E_MOCK_AI;
  afterEach(() => {
    process.env.E2E_MOCK_AI = prev;
  });

  it("provides FakeAIService for the AIService token when E2E_MOCK_AI=true", async () => {
    process.env.E2E_MOCK_AI = "true";
    const moduleRef = await Test.createTestingModule({ imports: [AIModule] }).compile();
    expect(moduleRef.get(AIService)).toBeInstanceOf(FakeAIService);
  });
});
