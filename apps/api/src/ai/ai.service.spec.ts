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
    it("should return transcription text from audio buffer", async () => {
      mockOpenAI.audio.transcriptions.create.mockResolvedValue({
        text: "We need to add user authentication and a dashboard page.",
      });

      const result = await service.transcribe(Buffer.from("fake-audio"), "recording.mp3");

      expect(result).toBe("We need to add user authentication and a dashboard page.");
      expect(mockOpenAI.audio.transcriptions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "whisper-1",
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
});
