import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Inject, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { AIService } from "../ai/ai.service.js";
import { AnalyticsService } from "../analytics/analytics.service.js";
import { ProjectsService } from "../projects/projects.service";
import { STORAGE_ADAPTER, type StorageAdapter } from "../storage/storage.interface.js";
import { TicketsService } from "../tickets/tickets.service";
import { AudioGateway } from "./audio.gateway.js";
import { AudioService } from "./audio.service";

export interface AudioJobData {
  audioId: string;
  userId: string;
}

@Processor("audio-processing")
export class AudioProcessor extends WorkerHost {
  private readonly logger = new Logger(AudioProcessor.name);

  constructor(
    private readonly audioService: AudioService,
    private readonly aiService: AIService,
    private readonly ticketsService: TicketsService,
    private readonly projectsService: ProjectsService,
    private readonly analyticsService: AnalyticsService,
    private readonly audioGateway: AudioGateway,
    @Inject(STORAGE_ADAPTER) private readonly storage: StorageAdapter,
  ) {
    super();
  }

  async process(job: Job<AudioJobData>): Promise<void> {
    const { audioId, userId } = job.data;
    this.logger.log(`Processing audio ${audioId} for user ${userId}`);

    try {
      const recording = await this.audioService.findOne(audioId, userId);

      // Step 1: Transcribe
      this.logger.log(`[${audioId}] Transcribing...`);
      await this.audioService.updateStatus(audioId, "TRANSCRIBING");
      this.audioGateway.emitProgress(userId, audioId, "TRANSCRIBING");
      const audioBuffer = await this.storage.get(recording.filePath);
      const transcription = await this.aiService.transcribe(audioBuffer!, recording.fileName);

      // Get project context if available
      let projectContext: string | undefined;
      if (recording.projectId) {
        const project = await this.projectsService.findOne(recording.projectId, userId);
        projectContext = project.context ?? undefined;
      }

      // Step 2: Decompose + Generate (with project context)
      this.logger.log(`[${audioId}] Analyzing with AI...`);
      await this.audioService.updateStatus(audioId, "ANALYZING");
      this.audioGateway.emitProgress(userId, audioId, "ANALYZING");

      const tasks = await this.aiService.decompose(transcription, projectContext);
      const tickets = await this.aiService.generateTickets(tasks, projectContext);

      // Step 3: Save tickets + track each one
      for (const ticket of tickets) {
        const created = await this.ticketsService.create({
          title: ticket.title,
          description: ticket.description,
          priority: ticket.priority,
          audioRecordingId: audioId,
          projectId: recording.projectId ?? undefined,
          userId,
        });
        await this.analyticsService.track(userId, "ticket.generated", {
          audioId,
          ticketId: created.id,
        });
      }

      this.logger.log(`[${audioId}] Completed. ${tickets.length} tickets generated.`);
      await this.audioService.updateStatus(audioId, "COMPLETED");
      this.audioGateway.emitCompleted(userId, audioId, tickets.length);
    } catch (error) {
      this.logger.error(`[${audioId}] Failed: ${error instanceof Error ? error.message : error}`);
      await this.audioService.updateStatus(audioId, "FAILED");
      this.audioGateway.emitFailed(
        userId,
        audioId,
        error instanceof Error ? error.message : "Processing failed",
      );
      throw error;
    }
  }
}
