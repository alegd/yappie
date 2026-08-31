import { Module } from "@nestjs/common";
import OpenAI from "openai";
import { AIService } from "./ai.service.js";
import { FakeAIService } from "./fake-ai.service.js";
import { OPENAI_CLIENT } from "./ai.constants.js";

@Module({
  providers: [
    {
      provide: OPENAI_CLIENT,
      useFactory: () =>
        new OpenAI({
          apiKey: process.env.OPENAI_API_KEY ?? "e2e-placeholder",
        }),
    },
    {
      provide: AIService,
      useFactory: (openaiClient: OpenAI) => {
        if (process.env.E2E_MOCK_AI === "true") {
          return new FakeAIService();
        }
        return new AIService(openaiClient);
      },
      inject: [OPENAI_CLIENT],
    },
  ],
  exports: [AIService],
})
export class AIModule {}
