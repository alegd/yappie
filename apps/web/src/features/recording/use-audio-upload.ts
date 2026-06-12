"use client";

import { useState } from "react";
import type { AudioRecording } from "@/features/audio/types";
import { apiFetcher } from "@/lib/api-fetcher";
import { AUDIO_UPLOAD } from "@/lib/constants/endpoints";
import { POST } from "@/lib/constants/http";

const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
export const MAX_AUDIO_LABEL = "5 MB";

export class FileTooLargeError extends Error {
  constructor() {
    super(`File too large. Maximum size is ${MAX_AUDIO_LABEL}.`);
    this.name = "FileTooLargeError";
  }
}

interface UseAudioUploadResult {
  upload: (file: File) => Promise<AudioRecording>;
  isUploading: boolean;
}

export function useAudioUpload(projectId: string): UseAudioUploadResult {
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (file: File): Promise<AudioRecording> => {
    if (file.size > MAX_AUDIO_BYTES) {
      throw new FileTooLargeError();
    }
    setIsUploading(true);
    try {
      const url = `${AUDIO_UPLOAD}?projectId=${projectId}`;
      return await apiFetcher(url, {
        data: { file: { name: "file", value: [file] } },
        method: POST,
        headers: { "Content-Type": "multipart/form-data" },
      });
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading };
}
