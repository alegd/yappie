import { render, fireEvent } from "@testing-library/react-native";
import { AudioRow } from "./audio-row";
import type { AudioRecording } from "@/lib/api/types";

function buildAudio(overrides: Partial<AudioRecording> = {}): AudioRecording {
  return {
    id: "a1",
    fileName: "standup-notes.m4a",
    fileSize: 12345,
    mimeType: "audio/mp4",
    duration: 47,
    status: "COMPLETED",
    transcription: null,
    errorMessage: null,
    projectId: "p1",
    createdAt: "2026-05-12T10:00:00Z",
    updatedAt: "2026-05-12T10:00:00Z",
    ...overrides,
  };
}

describe("AudioRow", () => {
  const now = new Date("2026-05-12T12:00:00Z").getTime();

  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the file name", () => {
    const { getByText } = render(<AudioRow audio={buildAudio()} onPress={() => {}} />);
    expect(getByText("standup-notes.m4a")).toBeTruthy();
  });

  it("renders the duration formatted as MM:SS", () => {
    const { getByText } = render(
      <AudioRow audio={buildAudio({ duration: 125 })} onPress={() => {}} />,
    );
    expect(getByText(/2:05/)).toBeTruthy();
  });

  it("renders the time-ago for the createdAt timestamp", () => {
    const { getByText } = render(<AudioRow audio={buildAudio()} onPress={() => {}} />);
    expect(getByText(/2h ago/)).toBeTruthy();
  });

  it("renders the status badge label", () => {
    const { getByText } = render(
      <AudioRow audio={buildAudio({ status: "TRANSCRIBING" })} onPress={() => {}} />,
    );
    expect(getByText("TRANSCRIBING")).toBeTruthy();
  });

  it("fires onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByText } = render(<AudioRow audio={buildAudio()} onPress={onPress} />);
    fireEvent.press(getByText("standup-notes.m4a"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
