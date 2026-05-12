import { apiFetch } from "./client";
import type { AudioRecording, AudioRecordingWithTickets, Paginated } from "./types";

export function listAudios(
  projectId: string,
  page = 1,
  limit = 20,
): Promise<Paginated<AudioRecording>> {
  return apiFetch<Paginated<AudioRecording>>(
    `/audio?projectId=${projectId}&page=${page}&limit=${limit}`,
  );
}

export function listRecentAudios(limit = 10): Promise<Paginated<AudioRecording>> {
  return apiFetch<Paginated<AudioRecording>>(`/audio?limit=${limit}`);
}

export function getAudio(id: string): Promise<AudioRecordingWithTickets> {
  return apiFetch<AudioRecordingWithTickets>(`/audio/${id}`);
}

export function uploadAudio(formData: FormData, projectId?: string): Promise<AudioRecording> {
  const path = projectId ? `/audio/upload?projectId=${projectId}` : "/audio/upload";
  return apiFetch<AudioRecording>(path, {
    method: "POST",
    body: formData,
  });
}

export function deleteAudio(id: string): Promise<void> {
  return apiFetch<void>(`/audio/${id}`, { method: "DELETE" });
}
