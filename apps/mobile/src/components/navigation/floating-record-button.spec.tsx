const mockPush = jest.fn();
let mockSegments: string[] = [];
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useSegments: () => mockSegments,
  useLocalSearchParams: () => mockParams,
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, fireEvent } = require("@testing-library/react-native") as typeof import("@testing-library/react-native");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FloatingRecordButton } = require("./floating-record-button") as typeof import("./floating-record-button");

describe("FloatingRecordButton", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockSegments = [];
    mockParams = {};
  });

  it("renders the record button on home", () => {
    mockSegments = ["(app)", "(tabs)", "home"];
    const { getByLabelText } = render(<FloatingRecordButton />);
    expect(getByLabelText("Record audio")).toBeTruthy();
  });

  it("renders the record button on projects list", () => {
    mockSegments = ["(app)", "(tabs)", "projects"];
    const { getByLabelText } = render(<FloatingRecordButton />);
    expect(getByLabelText("Record audio")).toBeTruthy();
  });

  it("hides on settings", () => {
    mockSegments = ["(app)", "settings"];
    const { queryByLabelText } = render(<FloatingRecordButton />);
    expect(queryByLabelText("Record audio")).toBeNull();
  });

  it("hides on the record modal route", () => {
    mockSegments = ["(app)", "record"];
    const { queryByLabelText } = render(<FloatingRecordButton />);
    expect(queryByLabelText("Record audio")).toBeNull();
  });

  it("hides on the project-form screen", () => {
    mockSegments = ["(app)", "project-form"];
    const { queryByLabelText } = render(<FloatingRecordButton />);
    expect(queryByLabelText("Record audio")).toBeNull();
  });

  it("pushes /record with no params from a tab route", () => {
    mockSegments = ["(app)", "(tabs)", "home"];
    const { getByLabelText } = render(<FloatingRecordButton />);
    fireEvent.press(getByLabelText("Record audio"));
    expect(mockPush).toHaveBeenCalledWith("/record");
  });

  it("pre-fills projectId when on a project view", () => {
    mockSegments = ["(app)", "projects", "[id]"];
    mockParams = { id: "p1" };
    const { getByLabelText } = render(<FloatingRecordButton />);
    fireEvent.press(getByLabelText("Record audio"));
    expect(mockPush).toHaveBeenCalledWith("/record?projectId=p1");
  });
});
