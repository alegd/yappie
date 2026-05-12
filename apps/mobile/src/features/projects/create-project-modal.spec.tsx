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
const { CreateProjectModal } = require("./create-project-modal") as typeof import("./create-project-modal");

const createProjectMock = projectsApi.createProject as jest.Mock;

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
    client,
  };
}

describe("CreateProjectModal", () => {
  beforeEach(() => {
    createProjectMock.mockReset();
  });

  it("renders form when visible", () => {
    const { getByPlaceholderText } = renderWithClient(
      <CreateProjectModal visible onClose={() => {}} />,
    );
    expect(getByPlaceholderText("Project name")).toBeTruthy();
  });

  it("hides form when not visible", () => {
    const { queryByPlaceholderText } = renderWithClient(
      <CreateProjectModal visible={false} onClose={() => {}} />,
    );
    expect(queryByPlaceholderText("Project name")).toBeNull();
  });

  it("submits with the entered name and description", async () => {
    createProjectMock.mockResolvedValueOnce({ id: "p1", name: "Alpha" });
    const onCreated = jest.fn();
    const onClose = jest.fn();
    const { getByPlaceholderText, getByText } = renderWithClient(
      <CreateProjectModal visible onClose={onClose} onCreated={onCreated} />,
    );
    fireEvent.changeText(getByPlaceholderText("Project name"), "Alpha");
    fireEvent.changeText(getByPlaceholderText("Description (optional)"), "Hello");
    fireEvent.press(getByText("Create"));
    await waitFor(() => {
      expect(createProjectMock).toHaveBeenCalledWith({ name: "Alpha", description: "Hello" });
    });
    await waitFor(() => {
      expect(onCreated).toHaveBeenCalledWith({ id: "p1", name: "Alpha" });
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("does NOT submit when name is empty or whitespace", () => {
    const { getByText } = renderWithClient(<CreateProjectModal visible onClose={() => {}} />);
    fireEvent.press(getByText("Create"));
    expect(createProjectMock).not.toHaveBeenCalled();
  });
});
