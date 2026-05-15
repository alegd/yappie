const mockPush = jest.fn();
let mockParams: Record<string, string> = { id: "p1" };

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock("@/lib/api/projects", () => ({
  getProject: jest.fn(),
}));

jest.mock("@/lib/api/audios", () => ({
  listAudios: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, fireEvent, waitFor } = require("@testing-library/react-native") as typeof import("@testing-library/react-native");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query") as typeof import("@tanstack/react-query");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const projectsApi = require("@/lib/api/projects") as typeof import("@/lib/api/projects");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audiosApi = require("@/lib/api/audios") as typeof import("@/lib/api/audios");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ProjectView } = require("./project-view") as typeof import("./project-view");

const getProjectMock = projectsApi.getProject as jest.Mock;
const listAudiosMock = audiosApi.listAudios as jest.Mock;

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function buildProject() {
  return {
    id: "p1",
    name: "TiendaVerde",
    description: "Sustainable e-commerce",
    context: null,
    jiraProjectKey: null,
    userId: "u1",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };
}

function buildAudio(overrides: Partial<{ id: string; fileName: string }> = {}) {
  return {
    id: overrides.id ?? "a1",
    fileName: overrides.fileName ?? "audio.m4a",
    fileSize: 1,
    mimeType: "audio/mp4",
    duration: 47,
    status: "COMPLETED" as const,
    transcription: null,
    errorMessage: null,
    projectId: "p1",
    createdAt: "2026-05-12T10:00:00Z",
    updatedAt: "2026-05-12T10:00:00Z",
  };
}

describe("ProjectView", () => {
  beforeEach(() => {
    getProjectMock.mockReset();
    listAudiosMock.mockReset();
    mockPush.mockReset();
    mockParams = { id: "p1" };
  });

  it("renders the project name and description from the API", async () => {
    getProjectMock.mockResolvedValueOnce(buildProject());
    listAudiosMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 20 });
    const { findByText } = renderWithClient(<ProjectView />);
    expect(await findByText("TiendaVerde")).toBeTruthy();
    expect(await findByText("Sustainable e-commerce")).toBeTruthy();
  });

  it("renders an empty state when the project has zero audios", async () => {
    getProjectMock.mockResolvedValueOnce(buildProject());
    listAudiosMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 20 });
    const { findByText } = renderWithClient(<ProjectView />);
    expect(await findByText(/record button/i)).toBeTruthy();
  });

  it("renders one row per audio", async () => {
    getProjectMock.mockResolvedValueOnce(buildProject());
    listAudiosMock.mockResolvedValueOnce({
      data: [
        buildAudio({ id: "a1", fileName: "standup.m4a" }),
        buildAudio({ id: "a2", fileName: "call.m4a" }),
      ],
      total: 2,
      page: 1,
      limit: 20,
    });
    const { findByText } = renderWithClient(<ProjectView />);
    expect(await findByText("standup.m4a")).toBeTruthy();
    expect(await findByText("call.m4a")).toBeTruthy();
  });

  it("navigates to the edit form when the Edit button is pressed", async () => {
    getProjectMock.mockResolvedValue(buildProject());
    listAudiosMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 20 });
    const { findByLabelText } = renderWithClient(<ProjectView />);
    fireEvent.press(await findByLabelText("Edit project"));
    expect(mockPush).toHaveBeenCalledWith("/project-form?mode=edit&id=p1");
  });

  it("pushes /audios/<id> when an audio row is tapped", async () => {
    getProjectMock.mockResolvedValueOnce(buildProject());
    listAudiosMock.mockResolvedValueOnce({
      data: [buildAudio({ id: "a1", fileName: "standup.m4a" })],
      total: 1,
      page: 1,
      limit: 20,
    });
    const { findByText } = renderWithClient(<ProjectView />);
    fireEvent.press(await findByText("standup.m4a"));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/audios/a1");
    });
  });
});
