import { render, fireEvent } from "@testing-library/react-native";
import { Input } from "./input";

describe("Input", () => {
  it("renders the placeholder", () => {
    const { getByPlaceholderText } = render(
      <Input value="" onChangeText={() => {}} placeholder="Email" />,
    );
    expect(getByPlaceholderText("Email")).toBeTruthy();
  });

  it("calls onChangeText when text changes", () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <Input value="" onChangeText={onChangeText} placeholder="Email" />,
    );
    fireEvent.changeText(getByPlaceholderText("Email"), "new@example.com");
    expect(onChangeText).toHaveBeenCalledWith("new@example.com");
  });

  it("renders error message when error prop is set", () => {
    const { getByText } = render(
      <Input value="" onChangeText={() => {}} placeholder="Email" error="Invalid email" />,
    );
    expect(getByText("Invalid email")).toBeTruthy();
  });

  it("does NOT render error region when error is undefined", () => {
    const { queryByTestId } = render(<Input value="" onChangeText={() => {}} placeholder="Email" />);
    expect(queryByTestId("input-error")).toBeNull();
  });
});
