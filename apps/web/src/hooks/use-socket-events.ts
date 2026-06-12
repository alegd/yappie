"use client";

import { create } from "zustand";

interface AudioCompletedEvent {
  audioId: string;
  ticketCount: number;
  at: number;
}

interface AudioFailedEvent {
  audioId: string;
  error: string;
  at: number;
}

interface SocketEventsState {
  lastAudioCompleted: AudioCompletedEvent | null;
  lastAudioFailed: AudioFailedEvent | null;
  emitAudioCompleted: (data: { audioId: string; ticketCount: number }) => void;
  emitAudioFailed: (data: { audioId: string; error: string }) => void;
}

export const useSocketEvents = create<SocketEventsState>((set) => ({
  lastAudioCompleted: null,
  lastAudioFailed: null,
  emitAudioCompleted: ({ audioId, ticketCount }) =>
    set({ lastAudioCompleted: { audioId, ticketCount, at: Date.now() } }),
  emitAudioFailed: ({ audioId, error }) =>
    set({ lastAudioFailed: { audioId, error, at: Date.now() } }),
}));
