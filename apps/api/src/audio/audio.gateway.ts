import {
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Server, type Socket } from "socket.io";

@WebSocketGateway({ cors: { origin: "*" } })
export class AudioGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AudioGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  @WebSocketServer()
  server!: Server;

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth.token as string) ||
        (client.handshake.headers.authorization?.split(" ")[1] as string);

      if (!token) {
        this.logger.warn(`Client ${client.id} rejected: no token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub as string;

      client.data.userId = userId;
      client.join(`user:${userId}`);
      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
    } catch {
      this.logger.warn(`Client ${client.id} rejected: invalid token`);
      client.disconnect();
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
