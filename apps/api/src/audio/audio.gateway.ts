import {
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { type Server, type Socket } from "socket.io";

@WebSocketGateway({ cors: { origin: "*" } })
export class AudioGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AudioGateway.name);

  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(`user:${userId}`);
      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitProgress(userId: string, audioId: string, status: string) {
    this.server.to(`user:${userId}`).emit("audio:progress", { audioId, status });
  }

  emitCompleted(userId: string, audioId: string, ticketCount: number) {
    this.server.to(`user:${userId}`).emit("audio:completed", { audioId, ticketCount });
  }

  emitFailed(userId: string, audioId: string, error: string) {
    this.server.to(`user:${userId}`).emit("audio:failed", { audioId, error });
  }
}
