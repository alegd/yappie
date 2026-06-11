import type { AudioRecording } from "./types";

type StatusVariant = "default" | "info" | "purple" | "success" | "danger";

interface AudioStatusInfo {
  label: string;
  variant: StatusVariant;
}

export const audioStatusConfig: Record<AudioRecording["status"], AudioStatusInfo> = {
  PENDING: { label: "Pending", variant: "default" },
  TRANSCRIBING: { label: "Transcribing", variant: "info" },
  ANALYZING: { label: "Analyzing", variant: "purple" },
  COMPLETED: { label: "Completed", variant: "success" },
  FAILED: { label: "Failed", variant: "danger" },
};
