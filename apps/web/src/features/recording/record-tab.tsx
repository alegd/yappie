"use client";

import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAudioUpload } from "./use-audio-upload";
import { WaveformDecorative } from "./waveform-decorative";

interface RecordTabProps {
  projectId: string;
  disabled?: boolean;
  onUploaded: (audioId: string) => void;
  onError: (message: string, retryable: boolean) => void;
  onUploadingChange: (isUploading: boolean) => void;
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function RecordTab({
  projectId,
  disabled = false,
  onUploaded,
  onError,
  onUploadingChange,
}: RecordTabProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtRef = useRef<number>(0);

  const { upload } = useAudioUpload(projectId);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleStart = async () => {
    if (typeof MediaRecorder === "undefined") {
      onError("Recording not supported in this browser.", false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: "audio/webm" });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        try {
          onUploadingChange(true);
          const result = await upload(file);
          onUploaded(result.id);
        } catch (err) {
          onError(err instanceof Error ? err.message : "Upload failed", true);
        } finally {
          onUploadingChange(false);
        }
      };

      startedAtRef.current = Date.now();
      setElapsedMs(0);
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startedAtRef.current);
      }, 1000);
      recorder.start();
      setIsRecording(true);
    } catch {
      onError("Microphone access denied.", true);
    }
  };

  const handleStop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recorderRef.current?.stop();
    setIsRecording(false);
  };

  if (isRecording) {
    return (
      <div className="flex flex-col items-center gap-4 py-6">
        <WaveformDecorative />
        <p className="text-sm font-mono text-foreground/75" aria-label="Recording timer">
          {formatTime(elapsedMs)}
        </p>
        <Button variant="danger" onClick={handleStop} size="lg" aria-label="Stop recording">
          <Square size={16} />
          Stop
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <Button onClick={handleStart} disabled={disabled} size="lg" aria-label="Start recording">
        <Mic size={16} />
        Start
      </Button>
    </div>
  );
}
