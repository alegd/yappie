"use client";

import { useEffect, useRef } from "react";
import { mutate as globalMutate } from "swr";
import type { Socket } from "socket.io-client";
import { toast } from "@/components/ui/toast/Toast";
import { TICKETS_LIST } from "@/lib/constants/endpoints";
import { invalidateQuery } from "./use-query";
import { useSocketEvents } from "./use-socket-events";

interface UseSocketOptions {
  token: string | null;
}

const isAudioOrProjectsOrActivityKey = (key: unknown): boolean =>
  typeof key === "string" &&
  (key.startsWith("/v1/audio") || key.startsWith("/v1/projects") || key.startsWith("/v1/activity"));

export function useSocket({ token }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    let socket: Socket;

    async function connect() {
      const { io } = await import("socket.io-client");

      socket = io(window.location.origin, {
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
        globalMutate(isAudioOrProjectsOrActivityKey);
      });

      socket.on("audio:completed", (data: { audioId: string; ticketCount: number }) => {
        toast.success(
          `Done! ${data.ticketCount} ticket${data.ticketCount !== 1 ? "s" : ""} generated.`,
          { id: `progress-${data.audioId}` },
        );
        globalMutate(isAudioOrProjectsOrActivityKey);
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
        globalMutate(isAudioOrProjectsOrActivityKey);
      });
    }

    connect();

    return () => {
      if (socket) socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);
}
