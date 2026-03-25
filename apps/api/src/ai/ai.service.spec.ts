import { describe, it, expect, beforeEach, vi } from "vitest";
import { AIService } from "./ai.service.js";

function createMockOpenAI() {
  return {
    audio: {
      transcriptions: {
        create: vi.fn(),
      },
    },
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  };
}

describe("AIService", () => {
  let service: AIService;
  let mockOpenAI: ReturnType<typeof createMockOpenAI>;

  beforeEach(() => {
    vi.stubEnv("AI_TRANSCRIPTION_MODEL", "whisper-1");
    vi.stubEnv("AI_DECOMPOSITION_MODEL", "gpt-4o-mini");
    vi.stubEnv("AI_GENERATION_MODEL", "gpt-4o-mini");
    mockOpenAI = createMockOpenAI();
    service = new AIService(mockOpenAI as never);
  });

  describe("transcribe", () => {
    it("should return text and duration from verbose_json response", async () => {
      mockOpenAI.audio.transcriptions.create.mockResolvedValue({
        text: "We need to add user authentication and a dashboard page.",
        duration: 45.5,
      });

      const result = await service.transcribe(Buffer.from("fake-audio"), "recording.mp3");

      expect(result).toEqual({
        text: "We need to add user authentication and a dashboard page.",
        duration: 45.5,
      });
      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "whisper-1",
          response_format: "verbose_json",
        }),
      );
    });
  });

  describe("decompose", () => {
    it("should decompose transcription into task array", async () => {
      const tasks = [
        { title: "Implement user authentication", description: "Add JWT-based auth flow" },
        { title: "Create dashboard page", description: "Build main dashboard with widgets" },
      ];

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(tasks),
            },
          },
        ],
      });

      const result = await service.decompose(
        "We need to add user authentication and a dashboard page.",
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("title", "Implement user authentication");
      expect(result[1]).toHaveProperty("title", "Create dashboard page");
    });

    it("should handle empty task list", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: "[]" } }],
      });

      const result = await service.decompose("Nothing actionable here.");

      expect(result).toEqual([]);
    });
  });

  describe("generateTickets", () => {
    it("should generate structured tickets from tasks", async () => {
      const tickets = [
        {
          title: "Implement JWT auth",
          description: "Add login/register endpoints with JWT tokens",
          priority: "HIGH",
        },
        {
          title: "Create dashboard",
          description: "Build dashboard with overview widgets",
          priority: "MEDIUM",
        },
      ];

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(tickets) } }],
      });

      const tasks = [
        { title: "Implement user authentication", description: "Add JWT-based auth flow" },
        { title: "Create dashboard page", description: "Build main dashboard" },
      ];

      const result = await service.generateTickets(tasks);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty("title");
      expect(result[0]).toHaveProperty("description");
      expect(result[0]).toHaveProperty("priority");
    });
  });

  describe("parseJsonArray edge cases", () => {
    it("should handle { items: [...] } format", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                items: [{ title: "Task 1", description: "Desc 1" }],
              }),
            },
          },
        ],
      });

      const result = await service.decompose("some text");
      expect(result).toHaveLength(1);
    });

    it("should handle single object response", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ title: "Single task", description: "Only one" }),
            },
          },
        ],
      });

      const result = await service.decompose("one task");
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Single task");
    });

    it("should return empty array on invalid JSON", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: "not json at all" } }],
      });

      const result = await service.decompose("bad response");
      expect(result).toEqual([]);
    });

    it("should return empty array on empty object", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: "{}" } }],
      });

      const result = await service.decompose("empty");
      expect(result).toEqual([]);
    });

    it("should handle missing content", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const result = await service.decompose("null content");
      expect(result).toEqual([]);
    });

    it("should use project context in decompose prompt", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '{"items": []}' } }],
      });

      await service.decompose("text", "React e-commerce app");

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining("React e-commerce app"),
            }),
          ]),
        }),
      );
    });

    it("should use project context in generateTickets prompt", async () => {
      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [{ message: { content: '{"items": []}' } }],
      });

      await service.generateTickets([{ title: "t", description: "d" }], "NestJS API");

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining("NestJS API"),
            }),
          ]),
        }),
      );
    });
  });
});
