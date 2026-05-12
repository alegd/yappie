import { render, fireEvent } from "@testing-library/react-native";
import { Button } from "./button";

describe("Button", () => {
  it("renders the label", () => {
    const { getByText } = render(<Button label="Submit" onPress={() => {}} />);
    expect(getByText("Submit")).toBeTruthy();
  });

  it("fires onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Tap" onPress={onPress} />);
    fireEvent.press(getByText("Tap"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire onPress when disabled", () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="No" onPress={onPress} disabled />);
    fireEvent.press(getByText("No"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("does NOT fire onPress when loading", () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Send" onPress={onPress} loading />);
    fireEvent.press(getByText(/Send/));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("renders 'Loading…' suffix when loading", () => {
    const { getByText } = render(<Button label="Send" onPress={() => {}} loading />);
    expect(getByText(/Loading/)).toBeTruthy();
  });
});
