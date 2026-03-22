export interface AudioRecording {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  duration: number | null;
  status: "PENDING" | "TRANSCRIBING" | "ANALYZING" | "COMPLETED" | "FAILED";
  transcription: string | null;
  errorMessage: string | null;
  userId: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
  tickets?: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
  }>;
}

export interface AudioListResponse {
  data: AudioRecording[];
  total: number;
  page: number;
  limit: number;
}
