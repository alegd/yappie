import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as Accordion from "@radix-ui/react-accordion";
import { describe, expect, it, vi } from "vitest";
import { AudioAccordion } from "./audio-accordion";
import type { AudioRecording } from "@/features/audio/types";

vi.mock("./audio-accordion-content", () => ({
  AudioAccordionContent: ({ audioId, isOpen }: { audioId: string; isOpen: boolean }) => (
    <div data-testid={`content-${audioId}`} data-open={String(isOpen)}>
      content
    </div>
  ),
}));

const audio: AudioRecording = {
  id: "a-1",
  fileName: "rec.webm",
  filePath: "",
  fileSize: 12345,
  mimeType: "audio/webm",
  duration: null,
  status: "COMPLETED",
  transcription: null,
  errorMessage: null,
  userId: "u-1",
  projectId: "p-1",
  createdAt: "2026-06-10T10:00:00.000Z",
  updatedAt: "2026-06-10T10:00:00.000Z",
};

function renderWithRoot(node: React.ReactNode, value: string[]) {
  return render(
    <Accordion.Root type="multiple" value={value} onValueChange={() => {}}>
      {node}
    </Accordion.Root>,
  );
}

describe("AudioAccordion", () => {
  it("renders filename and a status badge", () => {
    renderWithRoot(
      <AudioAccordion
        audio={audio}
        isOpen={false}
        onToggle={vi.fn()}
        selection={new Set()}
        onSelectionChange={vi.fn()}
        jiraConnected={true}
      />,
      [],
    );
    expect(screen.getByText("rec.webm")).toBeInTheDocument();
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });

  it("does not render inner content while closed", () => {
    renderWithRoot(
      <AudioAccordion
        audio={audio}
        isOpen={false}
        onToggle={vi.fn()}
        selection={new Set()}
        onSelectionChange={vi.fn()}
        jiraConnected={true}
      />,
      [],
    );
    expect(screen.queryByTestId("content-a-1")).not.toBeInTheDocument();
  });

  it("renders inner content with isOpen=true when open", () => {
    renderWithRoot(
      <AudioAccordion
        audio={audio}
        isOpen={true}
        onToggle={vi.fn()}
        selection={new Set()}
        onSelectionChange={vi.fn()}
        jiraConnected={true}
      />,
      ["a-1"],
    );
    const content = screen.getByTestId("content-a-1");
    expect(content).toBeInTheDocument();
    expect(content).toHaveAttribute("data-open", "true");
  });

  it("clicking the trigger calls onToggle with the audio id", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    renderWithRoot(
      <AudioAccordion
        audio={audio}
        isOpen={false}
        onToggle={onToggle}
        selection={new Set()}
        onSelectionChange={vi.fn()}
        jiraConnected={true}
      />,
      [],
    );
    await user.click(screen.getByRole("button", { name: /rec\.webm/i }));
    expect(onToggle).toHaveBeenCalledWith("a-1");
  });
});
