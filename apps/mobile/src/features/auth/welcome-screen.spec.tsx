import React from "react";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
};
jest.mock("expo-router", () => ({
  router: mockRouter,
  useRouter: () => mockRouter,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, fireEvent } = require("@testing-library/react-native") as typeof import("@testing-library/react-native");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { WelcomeScreen } = require("./welcome-screen") as typeof import("./welcome-screen");

describe("WelcomeScreen", () => {
  beforeEach(() => {
    mockRouter.push.mockReset();
  });

  it("renders the Yappie wordmark, headline, subhead and Get started button", () => {
    const { getByText } = render(<WelcomeScreen />);

    expect(getByText("Yappie")).toBeTruthy();
    expect(getByText(/talk\. yappie writes the ticket/i)).toBeTruthy();
    expect(getByText(/turn voice notes into jira tickets/i)).toBeTruthy();
    expect(getByText(/get started/i)).toBeTruthy();
  });

  it("navigates to the email screen when Get started is pressed", () => {
    const { getByText } = render(<WelcomeScreen />);

    fireEvent.press(getByText(/get started/i));

    expect(mockRouter.push).toHaveBeenCalledWith("/email");
  });
});
