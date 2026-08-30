import { Injectable } from "@nestjs/common";

@Injectable()
export class FakeAIService {
  async transcribe(
    _audioBuffer: Buffer,
    _fileName: string,
  ): Promise<{ text: string; duration: number }> {
    return { text: "E2E transcription: add a login button and fix the header.", duration: 5 };
  }

  async decompose(
    _transcription: string,
    _projectContext?: string,
  ): Promise<Array<{ title: string; description: string }>> {
    return [
      { title: "Add login button", description: "Add a login button to the header." },
      { title: "Fix header layout", description: "Correct the spacing in the header." },
    ];
  }

  async generateTickets(
    tasks: Array<{ title: string; description: string }>,
    _projectContext?: string,
  ): Promise<
    Array<{ title: string; description: string; priority: string; sourceQuote?: string }>
  > {
    return tasks.map((t) => ({
      title: t.title,
      description: t.description,
      priority: "MEDIUM",
      sourceQuote: "E2E",
    }));
  }
}
