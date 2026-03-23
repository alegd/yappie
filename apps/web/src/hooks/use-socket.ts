"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "@/components/ui/toast/Toast";
import { invalidateQuery } from "./use-query";
import { AUDIO_LIST, TICKETS_LIST } from "@/lib/constants/endpoints";

interface UseSocketOptions {
  token: string | null;
}

export function useSocket({ token }: UseSocketOptions) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(window.location.origin, {
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
      invalidateQuery(AUDIO_LIST);
    });

    socket.on("audio:completed", (data: { audioId: string; ticketCount: number }) => {
      toast.success(
        `Done! ${data.ticketCount} ticket${data.ticketCount !== 1 ? "s" : ""} generated.`,
        {
          id: `progress-${data.audioId}`,
        },
      );
      invalidateQuery(AUDIO_LIST);
      invalidateQuery(TICKETS_LIST);
    });

    socket.on("audio:failed", (data: { audioId: string; error: string }) => {
      toast.error(`Processing failed: ${data.error}`, {
        id: `progress-${data.audioId}`,
      });
      invalidateQuery(AUDIO_LIST);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);
}
