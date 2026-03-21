import { Inject, Injectable, Logger } from "@nestjs/common";
import OpenAI, { toFile } from "openai";
import { z } from "zod";
import { OPENAI_CLIENT } from "./ai.constants.js";

const TaskSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const TicketSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

const DECOMPOSE_PROMPT = `You are a task decomposition assistant for a software project management tool called Yappie.
Given a transcription of a meeting, standup, voice note, or brainstorming session, extract actionable development tasks.

Rules:
- Each task should be a single, well-defined unit of work
- Title should be concise (max 80 chars) and action-oriented (start with a verb)
- Description should explain what needs to be done and why
- Ignore filler words, small talk, and non-actionable statements
- If there are no actionable tasks, return an empty array []

Return ONLY a valid JSON array of objects with "title" and "description" fields.
No markdown, no code blocks, no explanation.`;

const GENERATE_PROMPT = `You are a Jira ticket generator for a software project management tool.
Given a list of decomposed tasks, generate well-structured Jira-ready tickets.

Rules:
- Title: concise, action-oriented, max 80 characters
- Description: detailed with acceptance criteria in markdown format
- Priority: assess based on urgency and impact (LOW, MEDIUM, HIGH, CRITICAL)
- Each ticket should be independently implementable

Return ONLY a valid JSON array of objects with "title", "description", and "priority" fields.
No markdown, no code blocks, no explanation.`;

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly transcriptionModel: string;
  private readonly decompositionModel: string;
  private readonly generationModel: string;

  constructor(@Inject(OPENAI_CLIENT) private readonly openai: OpenAI) {
    this.transcriptionModel = process.env.AI_TRANSCRIPTION_MODEL!;
    this.decompositionModel = process.env.AI_DECOMPOSITION_MODEL!;
    this.generationModel = process.env.AI_GENERATION_MODEL!;
  }

  async transcribe(audioBuffer: Buffer, fileName: string): Promise<string> {
    const file = await toFile(audioBuffer, fileName);

    const response = await this.openai.audio.transcriptions.create({
      model: this.transcriptionModel,
      file,
    });

    return response.text;
  }

  async decompose(
    transcription: string,
    projectContext?: string,
  ): Promise<Array<{ title: string; description: string }>> {
    const systemPrompt = projectContext
      ? `${DECOMPOSE_PROMPT}\n\nProject context:\n${projectContext}`
      : DECOMPOSE_PROMPT;

    const response = await this.openai.chat.completions.create({
      model: this.decompositionModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: transcription },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "[]";
    return this.parseJsonArray(content, TaskSchema);
  }

  async generateTickets(
    tasks: Array<{ title: string; description: string }>,
    projectContext?: string,
  ): Promise<Array<{ title: string; description: string; priority: string }>> {
    const systemPrompt = projectContext
      ? `${GENERATE_PROMPT}\n\nProject context:\n${projectContext}`
      : GENERATE_PROMPT;

    const response = await this.openai.chat.completions.create({
      model: this.generationModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: JSON.stringify(tasks) },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content ?? "[]";
    return this.parseJsonArray(content, TicketSchema);
  }

  private parseJsonArray<T>(content: string, schema: z.ZodType<T>): T[] {
    try {
      const parsed = JSON.parse(content);
      this.logger.debug(`AI raw response: ${content}`);

      // Handle both [...] and { anyKey: [...] } formats
      let array: unknown[];
      if (Array.isArray(parsed)) {
        array = parsed;
      } else {
        // Find the first array value in the object
        const firstArray = Object.values(parsed).find((v) => Array.isArray(v)) as
          | unknown[]
          | undefined;
        array = firstArray ?? [];
      }

      return z.array(schema).parse(array);
    } catch (error) {
      this.logger.error(`Failed to parse AI response: ${content}`, error);
      return [];
    }
  }
}
