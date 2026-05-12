import { render, fireEvent } from "@testing-library/react-native";
import { TranscriptionBlock } from "./transcription-block";

describe("TranscriptionBlock", () => {
  it("shows a muted message when transcription is null", () => {
    const { getByText } = render(<TranscriptionBlock text={null} />);
    expect(getByText(/not available yet/i)).toBeTruthy();
  });

  it("starts collapsed when text is present", () => {
    const { queryByText, getByText } = render(<TranscriptionBlock text="Hello world" />);
    expect(getByText(/show transcription/i)).toBeTruthy();
    expect(queryByText("Hello world")).toBeNull();
  });

  it("expands when the toggle is pressed", () => {
    const { getByText, queryByText } = render(<TranscriptionBlock text="Hello world" />);
    fireEvent.press(getByText(/show transcription/i));
    expect(queryByText("Hello world")).toBeTruthy();
  });

  it("collapses when toggled again", () => {
    const { getByText, queryByText } = render(<TranscriptionBlock text="Hello world" />);
    fireEvent.press(getByText(/show transcription/i));
    fireEvent.press(getByText(/hide transcription/i));
    expect(queryByText("Hello world")).toBeNull();
  });
});
