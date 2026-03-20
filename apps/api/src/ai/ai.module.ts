import { Module } from "@nestjs/common";
import OpenAI from "openai";
import { AIService } from "./ai.service.js";
import { OPENAI_CLIENT } from "./ai.constants.js";

@Module({
  providers: [
    {
      provide: OPENAI_CLIENT,
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
