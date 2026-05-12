const mockReplace = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/lib/api/projects", () => ({
  createProject: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, fireEvent, waitFor } = require("@testing-library/react-native") as typeof import("@testing-library/react-native");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query") as typeof import("@tanstack/react-query");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const projectsApi = require("@/lib/api/projects") as typeof import("@/lib/api/projects");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { OnboardingScreen } = require("./onboarding-screen") as typeof import("./onboarding-screen");

const createProjectMock = projectsApi.createProject as jest.Mock;

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("OnboardingScreen", () => {
  beforeEach(() => {
    createProjectMock.mockReset();
    mockReplace.mockReset();
  });

  it("renders the welcome text and the create form", () => {
    const { getByText, getByPlaceholderText } = renderWithClient(<OnboardingScreen />);
    expect(getByText("Welcome to Yappie")).toBeTruthy();
    expect(getByPlaceholderText("Project name")).toBeTruthy();
  });

  it("does NOT submit when the name is empty", () => {
    const { getByText } = renderWithClient(<OnboardingScreen />);
    fireEvent.press(getByText("Create project"));
    expect(createProjectMock).not.toHaveBeenCalled();
  });

  it("replaces to /projects/<id> on successful create", async () => {
    createProjectMock.mockResolvedValueOnce({ id: "p1", name: "First" });
    const { getByPlaceholderText, getByText } = renderWithClient(<OnboardingScreen />);
    fireEvent.changeText(getByPlaceholderText("Project name"), "First");
    fireEvent.press(getByText("Create project"));
    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalledWith({ name: "First", description: undefined });
    });
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/projects/p1");
    });
  });

  it("shows an error message when the create fails", async () => {
    createProjectMock.mockRejectedValueOnce(new Error("Server boom"));
    const { getByPlaceholderText, getByText, findByText } = renderWithClient(<OnboardingScreen />);
    fireEvent.changeText(getByPlaceholderText("Project name"), "Boom");
    fireEvent.press(getByText("Create project"));
    expect(await findByText("Server boom")).toBeTruthy();
  });
});
