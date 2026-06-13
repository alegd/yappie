import { beforeEach, describe, expect, it } from "vitest";
import { useRecordingModalStore } from "./recording-modal-store";

describe("useRecordingModalStore", () => {
  beforeEach(() => {
    useRecordingModalStore.setState({ isOpen: false, projectId: null });
  });

  it("starts closed with no projectId", () => {
    const state = useRecordingModalStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.projectId).toBeNull();
  });

  it("open() without arg sets isOpen=true and projectId=null", () => {
    useRecordingModalStore.getState().open();
    const state = useRecordingModalStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.projectId).toBeNull();
  });

  it("open(id) sets isOpen=true and projectId=id", () => {
    useRecordingModalStore.getState().open("p-1");
    const state = useRecordingModalStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.projectId).toBe("p-1");
  });

  it("close() resets isOpen and projectId", () => {
    useRecordingModalStore.getState().open("p-1");
    useRecordingModalStore.getState().close();
    const state = useRecordingModalStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.projectId).toBeNull();
  });

  it("opening again overwrites projectId", () => {
    useRecordingModalStore.getState().open("p-1");
    useRecordingModalStore.getState().open("p-2");
    expect(useRecordingModalStore.getState().projectId).toBe("p-2");
  });

  it("open() after open(id) resets projectId to null", () => {
    useRecordingModalStore.getState().open("p-1");
    useRecordingModalStore.getState().open();
    expect(useRecordingModalStore.getState().projectId).toBeNull();
  });
});
