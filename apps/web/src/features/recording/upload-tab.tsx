"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast/Toast";
import { cn } from "@/lib/utils";
import { useAudioUpload } from "./use-audio-upload";

interface UploadTabProps {
  projectId: string;
  disabled?: boolean;
  onUploaded: (audioId: string) => void;
  onError: (message: string, retryable: boolean) => void;
  onUploadingChange: (isUploading: boolean) => void;
}

export function UploadTab({
  projectId,
  disabled = false,
  onUploaded,
  onError,
  onUploadingChange,
}: UploadTabProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const { upload } = useAudioUpload(projectId);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("audio/")) {
      toast.error("Audio files only");
      return;
    }
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

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFile(file);
    e.target.value = "";
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await handleFile(file);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "w-full rounded-lg border-2 border-dashed border-border p-6 text-center transition",
          dragging && "border-primary bg-surface-hover",
        )}
        aria-label="Audio drop zone"
      >
        <Upload size={24} className="mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-foreground/75">Drag and drop an audio file here</p>
        <p className="text-xs text-foreground/50">or</p>
        <Button onClick={() => inputRef.current?.click()} disabled={disabled} className="mt-2">
          Choose file
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        onChange={handleChange}
        className="hidden"
        aria-label="Audio file input"
      />
    </div>
  );
}
