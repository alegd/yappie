"use client";

import { create } from "zustand";

interface AudioCompletedEvent {
  audioId: string;
  ticketCount: number;
  at: number;
}

interface SocketEventsState {
  lastAudioCompleted: AudioCompletedEvent | null;
  emitAudioCompleted: (data: { audioId: string; ticketCount: number }) => void;
}

export const useSocketEvents = create<SocketEventsState>((set) => ({
  lastAudioCompleted: null,
  emitAudioCompleted: ({ audioId, ticketCount }) =>
    set({ lastAudioCompleted: { audioId, ticketCount, at: Date.now() } }),
}));
