"use client";

import { create } from "zustand";

interface RecordingModalState {
  isOpen: boolean;
  projectId: string | null;
  open: (projectId?: string) => void;
  close: () => void;
}

export const useRecordingModalStore = create<RecordingModalState>((set) => ({
  isOpen: false,
  projectId: null,
  open: (projectId?: string) => set({ isOpen: true, projectId: projectId ?? null }),
  close: () => set({ isOpen: false, projectId: null }),
}));
