"use client";

import { useState, useRef } from "react";
import { Upload, Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { AUDIO_UPLOAD } from "@/lib/constants/endpoints";
import { AudioRecording } from "./types";

interface AudioUploadProps {
  projectId?: string;
  onUploaded: (recording: AudioRecording) => void;
}

export function AudioUpload({ projectId, onUploaded }: AudioUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
    e.target.value = "";
  };

  const uploadFile = async (file: File) => {
    setError("");
    setUploading(true);
    try {
      const params: Record<string, string> = {};
      if (projectId) params.projectId = projectId;
      const result = await api.upload<AudioRecording>(AUDIO_UPLOAD, file, params);
      onUploaded(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        await uploadFile(file);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      setError("Microphone access denied");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading || recording}>
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? "Uploading..." : "Upload audio"}
        </Button>

        <Button
          variant={recording ? "danger" : "secondary"}
          onClick={recording ? stopRecording : startRecording}
          disabled={uploading}
        >
          {recording ? <Square size={16} /> : <Mic size={16} />}
          {recording ? "Stop" : "Record"}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
