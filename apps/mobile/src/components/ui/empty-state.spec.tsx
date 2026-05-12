import { render, fireEvent } from "@testing-library/react-native";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
  it("renders the headline and body", () => {
    const { getByText } = render(
      <EmptyState headline="No projects" body="Create one to start." />,
    );
    expect(getByText("No projects")).toBeTruthy();
    expect(getByText("Create one to start.")).toBeTruthy();
  });

  it("renders the action button when provided", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <EmptyState
        headline="Empty"
        body="Nothing here."
        action={{ label: "Create", onPress }}
      />,
    );
    fireEvent.press(getByText("Create"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does NOT render an action button when action is missing", () => {
    const { queryByRole } = render(<EmptyState headline="Empty" body="Nothing here." />);
    expect(queryByRole("button")).toBeNull();
  });
});
