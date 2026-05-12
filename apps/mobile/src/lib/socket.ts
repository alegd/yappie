import { io, type Socket } from "socket.io-client";
import type { QueryClient } from "@tanstack/react-query";
import { env } from "./env";
import { getAccessToken } from "./secure-store";
import { queryKeys } from "./query-keys";

let socket: Socket | null = null;

export async function connectSocket(queryClient: QueryClient): Promise<Socket | null> {
  if (socket?.connected) return socket;

  const token = await getAccessToken();
  if (!token) return null;

  socket = io(env.apiUrl, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
  });

  socket.on("audio:progress", ({ audioId }: { audioId: string }) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.audio(audioId) });
  });

  socket.on("audio:completed", ({ audioId }: { audioId: string }) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.audio(audioId) });
    queryClient.invalidateQueries({ queryKey: ["audios"] });
    queryClient.invalidateQueries({ queryKey: queryKeys.recentAudios });
  });

  socket.on("audio:failed", ({ audioId }: { audioId: string }) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.audio(audioId) });
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
