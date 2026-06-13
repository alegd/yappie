import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";
import { useRecordingModalStore } from "@/features/recording/recording-modal-store";

describe("EmptyState", () => {
  beforeEach(() => {
    useRecordingModalStore.setState({ isOpen: false, projectId: null });
  });

  it("renders a heading prompting the user to record their first audio", () => {
    render(<EmptyState projectId="p-1" />);
    expect(screen.getByText(/record your first audio/i)).toBeInTheDocument();
  });

  it("clicking Record opens the modal with the project preselected", () => {
    render(<EmptyState projectId="p-1" />);
    screen.getByRole("button", { name: /record/i }).click();
    const state = useRecordingModalStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.projectId).toBe("p-1");
  });
});
