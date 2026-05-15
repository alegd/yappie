const mockBack = jest.fn();
let mockSegments: string[] = [];

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack }),
  useSegments: () => mockSegments,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, fireEvent } = require("@testing-library/react-native") as typeof import("@testing-library/react-native");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FloatingBackButton } = require("./floating-back-button") as typeof import("./floating-back-button");

describe("FloatingBackButton", () => {
  beforeEach(() => {
    mockBack.mockReset();
    mockSegments = [];
  });

  it("renders on a detail screen whose segments include [id]", () => {
    mockSegments = ["(app)", "projects", "[id]"];
    const { getByLabelText } = render(<FloatingBackButton />);
    expect(getByLabelText("Go back")).toBeTruthy();
  });

  it("renders on the settings screen", () => {
    mockSegments = ["(app)", "settings"];
    const { getByLabelText } = render(<FloatingBackButton />);
    expect(getByLabelText("Go back")).toBeTruthy();
  });

  it("does not render on a tab screen", () => {
    mockSegments = ["(app)", "(tabs)", "projects"];
    const { queryByLabelText } = render(<FloatingBackButton />);
    expect(queryByLabelText("Go back")).toBeNull();
  });

  it("calls router.back when pressed", () => {
    mockSegments = ["(app)", "projects", "[id]"];
    const { getByLabelText } = render(<FloatingBackButton />);
    fireEvent.press(getByLabelText("Go back"));
    expect(mockBack).toHaveBeenCalled();
  });
});
