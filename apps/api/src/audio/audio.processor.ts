import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject } from "@nestjs/common";
import { type Job } from "bullmq";
import { type AudioService } from "./audio.service.js";
import { type AIService } from "../ai/ai.service.js";
import { type TicketsService } from "../tickets/tickets.service.js";
import { STORAGE_ADAPTER, type StorageAdapter } from "../storage/storage.interface.js";

export interface AudioJobData {
  audioId: string;
  userId: string;
}

@Processor("audio-processing")
export class AudioProcessor extends WorkerHost {
  constructor(
    private readonly audioService: AudioService,
    private readonly aiService: AIService,
    private readonly ticketsService: TicketsService,
    @Inject(STORAGE_ADAPTER) private readonly storage: StorageAdapter,
  ) {
    super();
  }

  async process(job: Job<AudioJobData>): Promise<void> {
    const { audioId, userId } = job.data;

    try {
      const recording = await this.audioService.findOne(audioId, userId);

      // Step 1: Transcribe
      await this.audioService.updateStatus(audioId, "TRANSCRIBING");
      const audioBuffer = await this.storage.get(recording.filePath);
      const transcription = await this.aiService.transcribe(audioBuffer!, recording.fileName);

      // Step 2: Decompose + Generate
      await this.audioService.updateStatus(audioId, "ANALYZING");
      const tasks = await this.aiService.decompose(transcription);
      const tickets = await this.aiService.generateTickets(tasks);

      // Step 3: Save tickets
      for (const ticket of tickets) {
        await this.ticketsService.create({
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          audioRecordingId: audioId,
          projectId: recording.projectId ?? undefined,
        });
      }

      await this.audioService.updateStatus(audioId, "COMPLETED");
    } catch (error) {
      await this.audioService.updateStatus(audioId, "FAILED");
      throw error;
    }
  }
}
