const mockBack = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));

jest.mock("@/lib/api/projects", () => ({
  createProject: jest.fn(),
  updateProject: jest.fn(),
}));

jest.mock("@/lib/api/jira", () => ({
  getJiraStatus: jest.fn(),
  getJiraProjects: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, fireEvent, waitFor } = require("@testing-library/react-native") as typeof import("@testing-library/react-native");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query") as typeof import("@tanstack/react-query");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const projectsApi = require("@/lib/api/projects") as typeof import("@/lib/api/projects");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jiraApi = require("@/lib/api/jira") as typeof import("@/lib/api/jira");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProjectFormScreen } = require("./project-form-screen") as typeof import("./project-form-screen");

const createProjectMock = projectsApi.createProject as jest.Mock;
const updateProjectMock = projectsApi.updateProject as jest.Mock;
const getJiraStatusMock = jiraApi.getJiraStatus as jest.Mock;

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function buildProject() {
  return {
    id: "p1",
    name: "TiendaVerde",
    description: "Sustainable shop",
    context: "Ana does frontend",
    jiraProjectKey: "TV",
    userId: "u1",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };
}

describe("ProjectFormScreen", () => {
  beforeEach(() => {
    createProjectMock.mockReset();
    updateProjectMock.mockReset();
    getJiraStatusMock.mockReset();
    getJiraStatusMock.mockResolvedValue({ connected: false });
    mockBack.mockReset();
  });

  it("renders the create form in create mode", () => {
    const { getByPlaceholderText } = renderWithClient(<ProjectFormScreen mode="create" />);
    expect(getByPlaceholderText("Project name")).toBeTruthy();
  });

  it("submits create with all four fields and navigates back", async () => {
    createProjectMock.mockResolvedValueOnce({ id: "p1", name: "Alpha" });
    const { getByPlaceholderText, getByText } = renderWithClient(<ProjectFormScreen mode="create" />);
    fireEvent.changeText(getByPlaceholderText("Project name"), "Alpha");
    fireEvent.changeText(getByPlaceholderText("Description (optional)"), "Hello");
    fireEvent.changeText(getByPlaceholderText("Context for the AI (optional)"), "Team context");
    fireEvent.press(getByText("Create"));
    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalledWith({
        name: "Alpha",
        description: "Hello",
        context: "Team context",
        jiraProjectKey: undefined,
      });
    });
    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it("does NOT submit create when name is empty or whitespace", () => {
    const { getByPlaceholderText, getByText } = renderWithClient(
      <ProjectFormScreen mode="create" />,
    );
    fireEvent.press(getByText("Create"));
    expect(createProjectMock).not.toHaveBeenCalled();

    fireEvent.changeText(getByPlaceholderText("Project name"), "   ");
    fireEvent.press(getByText("Create"));
    expect(createProjectMock).not.toHaveBeenCalled();
  });

  it("pre-fills the form from the project in edit mode", () => {
    const { getByDisplayValue } = renderWithClient(
      <ProjectFormScreen mode="edit" project={buildProject()} />,
    );
    expect(getByDisplayValue("TiendaVerde")).toBeTruthy();
    expect(getByDisplayValue("Sustainable shop")).toBeTruthy();
    expect(getByDisplayValue("Ana does frontend")).toBeTruthy();
  });

  it("submits update with the project id and navigates back in edit mode", async () => {
    updateProjectMock.mockResolvedValueOnce(buildProject());
    const { getByPlaceholderText, getByText } = renderWithClient(
      <ProjectFormScreen mode="edit" project={buildProject()} />,
    );
    fireEvent.changeText(getByPlaceholderText("Project name"), "TiendaVerde 2");
    fireEvent.press(getByText("Save"));
    await waitFor(() => {
      expect(updateProjectMock).toHaveBeenCalledWith("p1", {
        name: "TiendaVerde 2",
        description: "Sustainable shop",
        context: "Ana does frontend",
        jiraProjectKey: "TV",
      });
    });
    await waitFor(() => {
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it("shows an error and does not submit when context exceeds 5000 characters", () => {
    const { getByPlaceholderText, getByText, getByTestId } = renderWithClient(
      <ProjectFormScreen mode="create" />,
    );
    fireEvent.changeText(getByPlaceholderText("Project name"), "Alpha");
    fireEvent.changeText(getByPlaceholderText("Context for the AI (optional)"), "x".repeat(5001));
    fireEvent.press(getByText("Create"));
    expect(getByTestId("input-error")).toBeTruthy();
    expect(createProjectMock).not.toHaveBeenCalled();
  });
});
