import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./empty-state";

vi.mock("@/features/audio/audio-upload", () => ({
  AudioUpload: ({ projectId }: { projectId: string }) => (
    <div data-testid="audio-upload">audio-upload:{projectId}</div>
  ),
}));

describe("EmptyState", () => {
  it("renders a heading prompting the user to record their first audio", () => {
    render(<EmptyState projectId="p-1" onUploaded={vi.fn()} />);
    expect(screen.getByText(/record your first audio/i)).toBeInTheDocument();
  });

  it("renders AudioUpload bound to the project id", () => {
    render(<EmptyState projectId="p-1" onUploaded={vi.fn()} />);
    expect(screen.getByTestId("audio-upload")).toHaveTextContent("audio-upload:p-1");
  });
});
