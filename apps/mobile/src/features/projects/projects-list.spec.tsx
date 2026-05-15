const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
}));

jest.mock("@/lib/api/projects", () => ({
  listProjects: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, fireEvent, waitFor } = require("@testing-library/react-native") as typeof import("@testing-library/react-native");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query") as typeof import("@tanstack/react-query");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const projectsApi = require("@/lib/api/projects") as typeof import("@/lib/api/projects");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProjectsList } = require("./projects-list") as typeof import("./projects-list");

const listProjectsMock = projectsApi.listProjects as jest.Mock;

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
    client,
  };
}

function buildProject(overrides: Partial<{ id: string; name: string }> = {}) {
  return {
    id: overrides.id ?? "p1",
    name: overrides.name ?? "TiendaVerde",
    description: "Sustainable e-commerce",
    context: null,
    jiraProjectKey: null,
    userId: "u1",
    createdAt: "2026-05-10T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z",
  };
}

describe("ProjectsList", () => {
  beforeEach(() => {
    listProjectsMock.mockReset();
    mockReplace.mockReset();
    mockPush.mockReset();
  });

  it("redirects to /onboarding when the user has zero projects", async () => {
    listProjectsMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 50 });
    renderWithClient(<ProjectsList />);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/onboarding");
    });
  });

  it("renders the list of projects when data is present", async () => {
    listProjectsMock.mockResolvedValueOnce({
      data: [buildProject({ id: "p1", name: "TiendaVerde" })],
      total: 1,
      page: 1,
      limit: 50,
    });
    const { findByText } = renderWithClient(<ProjectsList />);
    expect(await findByText("TiendaVerde")).toBeTruthy();
  });

  it("pushes /projects/<id> when a project row is pressed", async () => {
    listProjectsMock.mockResolvedValueOnce({
      data: [buildProject({ id: "p1", name: "TiendaVerde" })],
      total: 1,
      page: 1,
      limit: 50,
    });
    const { findByText } = renderWithClient(<ProjectsList />);
    const row = await findByText("TiendaVerde");
    fireEvent.press(row);
    expect(mockPush).toHaveBeenCalledWith("/projects/p1");
  });

  it("navigates to the create form when the + button is pressed", async () => {
    listProjectsMock.mockResolvedValueOnce({
      data: [buildProject()],
      total: 1,
      page: 1,
      limit: 50,
    });
    const { findByLabelText } = renderWithClient(<ProjectsList />);
    const plus = await findByLabelText("Create project");
    fireEvent.press(plus);
    expect(mockPush).toHaveBeenCalledWith("/project-form?mode=create");
  });

  it("renders the settings button", async () => {
    listProjectsMock.mockResolvedValueOnce({
      data: [buildProject()],
      total: 1,
      page: 1,
      limit: 50,
    });
    const { findByLabelText } = renderWithClient(<ProjectsList />);
    expect(await findByLabelText("Open settings")).toBeTruthy();
  });
});
