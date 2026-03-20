import { Injectable } from "@nestjs/common";
import type OpenAI from "openai";
import { toFile } from "openai";
import { z } from "zod";

const TaskSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const TicketSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

@Injectable()
export class AIService {
  constructor(private readonly openai: OpenAI) {}

  async transcribe(audioBuffer: Buffer, fileName: string): Promise<string> {
    const file = await toFile(audioBuffer, fileName);

    const response = await this.openai.audio.transcriptions.create({
      model: "whisper-1",
      file,
    });

    return response.text;
  }

  async decompose(transcription: string): Promise<Array<{ title: string; description: string }>> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a task decomposition assistant. Given a transcription of a meeting or voice note, extract actionable tasks.
Return a JSON array of objects with "title" and "description" fields.
If there are no actionable tasks, return an empty array [].
Return ONLY valid JSON, no markdown or explanation.`,
        },
        { role: "user", content: transcription },
      ],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? "[]";
    const parsed = JSON.parse(content);
    return z.array(TaskSchema).parse(parsed);
  }

  async generateTickets(
    tasks: Array<{ title: string; description: string }>,
  ): Promise<Array<{ title: string; description: string; priority: string }>> {
    const response = await this.openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Jira ticket generator. Given a list of tasks, generate well-structured tickets.
Each ticket should have: "title" (concise), "description" (detailed with acceptance criteria), "priority" (LOW, MEDIUM, HIGH, or CRITICAL).
Return ONLY a valid JSON array, no markdown or explanation.`,
        },
        { role: "user", content: JSON.stringify(tasks) },
      ],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? "[]";
    const parsed = JSON.parse(content);
    return z.array(TicketSchema).parse(parsed);
  }
}
