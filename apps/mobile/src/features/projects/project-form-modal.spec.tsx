jest.mock("@/lib/api/projects", () => ({
  createProject: jest.fn(),
  updateProject: jest.fn(),
}));

jest.mock("@/lib/api/jira", () => ({
  getJiraStatus: jest.fn(),
  getJiraProjects: jest.fn(),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: jest.fn() }),
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
const { ProjectFormModal } = require("./project-form-modal") as typeof import("./project-form-modal");

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

describe("ProjectFormModal", () => {
  beforeEach(() => {
    createProjectMock.mockReset();
    updateProjectMock.mockReset();
    getJiraStatusMock.mockReset();
    getJiraStatusMock.mockResolvedValue({ connected: false });
  });

  it("renders the create form when visible in create mode", () => {
    const { getByPlaceholderText } = renderWithClient(
      <ProjectFormModal visible mode="create" onClose={() => {}} />,
    );
    expect(getByPlaceholderText("Project name")).toBeTruthy();
  });

  it("hides the form when not visible", () => {
    const { queryByPlaceholderText } = renderWithClient(
      <ProjectFormModal visible={false} mode="create" onClose={() => {}} />,
    );
    expect(queryByPlaceholderText("Project name")).toBeNull();
  });

  it("submits create with all four fields", async () => {
    createProjectMock.mockResolvedValueOnce({ id: "p1", name: "Alpha" });
    const onSaved = jest.fn();
    const onClose = jest.fn();
    const { getByPlaceholderText, getByText } = renderWithClient(
      <ProjectFormModal visible mode="create" onClose={onClose} onSaved={onSaved} />,
    );
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
      expect(onSaved).toHaveBeenCalledWith({ id: "p1", name: "Alpha" });
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("does NOT submit create when name is empty or whitespace", () => {
    const { getByText } = renderWithClient(
      <ProjectFormModal visible mode="create" onClose={() => {}} />,
    );
    fireEvent.press(getByText("Create"));
    expect(createProjectMock).not.toHaveBeenCalled();
  });

  it("pre-fills the form from the project in edit mode", () => {
    const { getByDisplayValue } = renderWithClient(
      <ProjectFormModal visible mode="edit" project={buildProject()} onClose={() => {}} />,
    );
    expect(getByDisplayValue("TiendaVerde")).toBeTruthy();
    expect(getByDisplayValue("Sustainable shop")).toBeTruthy();
    expect(getByDisplayValue("Ana does frontend")).toBeTruthy();
  });

  it("submits update with the project id in edit mode", async () => {
    updateProjectMock.mockResolvedValueOnce(buildProject());
    const onClose = jest.fn();
    const { getByPlaceholderText, getByText } = renderWithClient(
      <ProjectFormModal visible mode="edit" project={buildProject()} onClose={onClose} />,
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
    expect(onClose).toHaveBeenCalled();
  });

  it("shows an error and does not submit when context exceeds 5000 characters", () => {
    const { getByPlaceholderText, getByText, getByTestId } = renderWithClient(
      <ProjectFormModal visible mode="create" onClose={() => {}} />,
    );
    fireEvent.changeText(getByPlaceholderText("Project name"), "Alpha");
    fireEvent.changeText(getByPlaceholderText("Context for the AI (optional)"), "x".repeat(5001));
    fireEvent.press(getByText("Create"));
    expect(getByTestId("input-error")).toBeTruthy();
    expect(createProjectMock).not.toHaveBeenCalled();
  });
});
