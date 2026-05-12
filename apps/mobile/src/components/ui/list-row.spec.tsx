import { render, fireEvent } from "@testing-library/react-native";
import { ListRow } from "./list-row";

describe("ListRow", () => {
  it("renders the title", () => {
    const { getByText } = render(<ListRow title="My project" onPress={() => {}} />);
    expect(getByText("My project")).toBeTruthy();
  });

  it("renders the subtitle when provided", () => {
    const { getByText } = render(
      <ListRow title="Item" subtitle="extra info" onPress={() => {}} />,
    );
    expect(getByText("extra info")).toBeTruthy();
  });

  it("does NOT render subtitle when missing", () => {
    const { queryByTestId } = render(<ListRow title="Item" onPress={() => {}} />);
    expect(queryByTestId("list-row-subtitle")).toBeNull();
  });

  it("fires onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(<ListRow title="Tap" onPress={onPress} />);
    fireEvent.press(getByText("Tap"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
