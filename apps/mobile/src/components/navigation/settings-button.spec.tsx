/* eslint-disable @typescript-eslint/no-require-imports */
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const { render, fireEvent } =
  require("@testing-library/react-native") as typeof import("@testing-library/react-native");
const { SettingsButton } = require("./settings-button") as typeof import("./settings-button");

describe("SettingsButton", () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  it("renders a button with an accessibility label", () => {
    const { getByLabelText } = render(<SettingsButton />);
    expect(getByLabelText("Open settings")).toBeTruthy();
  });

  it("pushes /settings when pressed", () => {
    const { getByLabelText } = render(<SettingsButton />);
    fireEvent.press(getByLabelText("Open settings"));
    expect(mockPush).toHaveBeenCalledWith("/settings");
  });
});
