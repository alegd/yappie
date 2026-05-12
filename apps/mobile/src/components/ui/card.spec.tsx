import { render, fireEvent } from "@testing-library/react-native";
import { Text } from "react-native";
import { Card } from "./card";

describe("Card", () => {
  it("renders children", () => {
    const { getByText } = render(
      <Card>
        <Text>Inside</Text>
      </Card>,
    );
    expect(getByText("Inside")).toBeTruthy();
  });

  it("fires onPress when pressable", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Card onPress={onPress}>
        <Text>Tap me</Text>
      </Card>,
    );
    fireEvent.press(getByText("Tap me"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("is not pressable when onPress is missing", () => {
    const { getByText } = render(
      <Card>
        <Text>Static</Text>
      </Card>,
    );
    // No-op: should not throw
    fireEvent.press(getByText("Static"));
    expect(getByText("Static")).toBeTruthy();
  });
});
