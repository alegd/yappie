"use client";

import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { toast } from "@/components/ui/toast/Toast";
import {
  ACTIVITY_PREFIX,
  AUDIO_PREFIX,
  PROJECTS_PREFIX,
  TICKETS_LIST,
} from "@/lib/constants/endpoints";
import { invalidateQuery, invalidateQueryPrefix } from "./use-query";
import { useSocketEvents } from "./use-socket-events";

interface UseSocketOptions {
  token: string | null;
}

export function useSocket({ token }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    let socket: Socket;

    async function connect() {
      const { io } = await import("socket.io-client");

      socket = io(process.env.NEXT_PUBLIC_API_URL, {
        auth: { token },
        transports: ["websocket"],
      });

      socketRef.current = socket;

      socket.on("audio:progress", (data: { audioId: string; status: string }) => {
        const labels: Record<string, string> = {
          TRANSCRIBING: "Transcribing audio...",
          ANALYZING: "Analyzing with AI...",
        };
        const message = labels[data.status] || data.status;
        toast.info(message, { id: `progress-${data.audioId}` });
        invalidateQueryPrefix(AUDIO_PREFIX, PROJECTS_PREFIX, ACTIVITY_PREFIX);
      });

      socket.on("audio:completed", (data: { audioId: string; ticketCount: number }) => {
        toast.success(
          `Done! ${data.ticketCount} ticket${data.ticketCount !== 1 ? "s" : ""} generated.`,
          { id: `progress-${data.audioId}` },
        );
        invalidateQueryPrefix(AUDIO_PREFIX, PROJECTS_PREFIX, ACTIVITY_PREFIX);
        invalidateQuery(TICKETS_LIST);
        useSocketEvents.getState().emitAudioCompleted({
          audioId: data.audioId,
          ticketCount: data.ticketCount,
        });
      });

      socket.on("audio:failed", (data: { audioId: string; error: string }) => {
        toast.error(`Processing failed: ${data.error}`, {
          id: `progress-${data.audioId}`,
        });
        invalidateQueryPrefix(AUDIO_PREFIX, PROJECTS_PREFIX, ACTIVITY_PREFIX);
        useSocketEvents.getState().emitAudioFailed({
          audioId: data.audioId,
          error: data.error,
        });
      });
    }

    connect();

    return () => {
      if (socket) socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);
}
