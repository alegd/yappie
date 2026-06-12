"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSocketEvents } from "@/hooks/use-socket-events";

interface ProcessingStateProps {
  audioId: string;
  onCompleted: (ticketCount: number) => void;
  onFailed: (message: string) => void;
  onTimeout: () => void;
  onCancel: () => void;
}

const TIMEOUT_MS = 60_000;

export function ProcessingState({
  audioId,
  onCompleted,
  onFailed,
  onTimeout,
  onCancel,
}: ProcessingStateProps) {
  const lastCompleted = useSocketEvents((s) => s.lastAudioCompleted);
  const lastFailed = useSocketEvents((s) => s.lastAudioFailed);

  useEffect(() => {
    if (lastCompleted && lastCompleted.audioId === audioId) {
      onCompleted(lastCompleted.ticketCount);
    }
  }, [lastCompleted?.at, audioId]);

  useEffect(() => {
    if (lastFailed && lastFailed.audioId === audioId) {
      onFailed(lastFailed.error);
    }
  }, [lastFailed?.at, audioId]);

  useEffect(() => {
    const timer = setTimeout(onTimeout, TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <Loader2 size={32} className="animate-spin text-accent" />
      <p className="font-semibold">Processing your audio…</p>
      <p className="text-xs text-foreground/50">We&apos;re transcribing and generating tickets</p>
      <Button variant="ghost" size="sm" onClick={onCancel} className="mt-2">
        Continue in background
      </Button>
    </div>
  );
}
