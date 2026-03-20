import { Module } from "@nestjs/common";
import OpenAI from "openai";
import { AIService } from "./ai.service.js";

@Module({
  providers: [
    {
      provide: OpenAI,
      useFactory: () =>
        new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        }),
    },
    AIService,
  ],
  exports: [AIService],
})
export class AIModule {}
