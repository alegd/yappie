import { render, fireEvent } from "@testing-library/react-native";
import { ErrorScreen } from "./error-screen";

describe("ErrorScreen", () => {
  it("renders the error message", () => {
    const { getByText } = render(
      <ErrorScreen error={new Error("Boom")} resetErrorBoundary={() => {}} />,
    );
    expect(getByText(/boom/i)).toBeTruthy();
  });

  it("calls resetErrorBoundary when Try again is pressed", () => {
    const reset = jest.fn();
    const { getByText } = render(
      <ErrorScreen error={new Error("Boom")} resetErrorBoundary={reset} />,
    );
    fireEvent.press(getByText("Try again"));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
