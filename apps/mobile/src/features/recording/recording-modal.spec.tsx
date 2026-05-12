const mockBack = jest.fn();
const mockDismiss = jest.fn();
let mockParams: Record<string, string> = {};

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: mockBack, dismiss: mockDismiss }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock("@/lib/api/projects", () => ({
  listProjects: jest.fn(),
}));

// expo-audio mocked at module level so the component can import it without
// initializing native code. Chunks 2/3 replace these with real wiring.
jest.mock("expo-audio", () => ({
  useAudioRecorder: () => ({
    prepareToRecordAsync: jest.fn(),
    record: jest.fn(),
    stop: jest.fn().mockResolvedValue(undefined),
    uri: "file:///tmp/test.m4a",
    getStatus: () => ({ isRecording: false, durationMillis: 0 }),
  }),
  useAudioRecorderPermissions: () => [
    { granted: true, canAskAgain: true, status: "granted" },
    jest.fn().mockResolvedValue({ granted: true, canAskAgain: true, status: "granted" }),
  ],
  RecordingPresets: { HIGH_QUALITY: {} },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, fireEvent, waitFor } = require("@testing-library/react-native") as typeof import("@testing-library/react-native");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query") as typeof import("@tanstack/react-query");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const projectsApi = require("@/lib/api/projects") as typeof import("@/lib/api/projects");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { RecordingModal } = require("./recording-modal") as typeof import("./recording-modal");

const listProjectsMock = projectsApi.listProjects as jest.Mock;

function buildProject(overrides: Partial<{ id: string; name: string }> = {}) {
  return {
    id: overrides.id ?? "p1",
    name: overrides.name ?? "TiendaVerde",
    description: null,
    context: null,
    jiraProjectKey: null,
    userId: "u1",
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  };
}

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("RecordingModal", () => {
  beforeEach(() => {
    listProjectsMock.mockReset();
    mockBack.mockReset();
    mockDismiss.mockReset();
    mockParams = {};
  });

  it("shows project selector when no projectId is passed", async () => {
    mockParams = {};
    listProjectsMock.mockResolvedValueOnce({
      data: [buildProject({ id: "p1", name: "TiendaVerde" })],
      total: 1,
      page: 1,
      limit: 50,
    });
    const { findByText } = renderWithClient(<RecordingModal />);
    expect(await findByText(/choose a project/i)).toBeTruthy();
    expect(await findByText("TiendaVerde")).toBeTruthy();
  });

  it("starts in idle state with the pre-filled project from params", async () => {
    mockParams = { projectId: "p1" };
    listProjectsMock.mockResolvedValueOnce({
      data: [buildProject({ id: "p1", name: "TiendaVerde" })],
      total: 1,
      page: 1,
      limit: 50,
    });
    const { findByText, queryByText } = renderWithClient(<RecordingModal />);
    expect(await findByText("TiendaVerde")).toBeTruthy();
    expect(await findByText(/tap to record/i)).toBeTruthy();
    expect(queryByText(/choose a project/i)).toBeNull();
  });

  it("transitions from idle to recording when Record is pressed", async () => {
    mockParams = { projectId: "p1" };
    listProjectsMock.mockResolvedValueOnce({
      data: [buildProject()],
      total: 1,
      page: 1,
      limit: 50,
    });
    const { findByLabelText, findByText } = renderWithClient(<RecordingModal />);
    fireEvent.press(await findByLabelText("Start recording"));
    expect(await findByText("Stop")).toBeTruthy();
  });

  it("transitions from recording to uploading when Stop is pressed", async () => {
    mockParams = { projectId: "p1" };
    listProjectsMock.mockResolvedValueOnce({
      data: [buildProject()],
      total: 1,
      page: 1,
      limit: 50,
    });
    const { findByLabelText, findByText } = renderWithClient(<RecordingModal />);
    fireEvent.press(await findByLabelText("Start recording"));
    fireEvent.press(await findByText("Stop"));
    expect(await findByText(/processing/i)).toBeTruthy();
  });

  it("selecting a project from the list moves to idle state", async () => {
    mockParams = {};
    listProjectsMock.mockResolvedValueOnce({
      data: [buildProject({ id: "p1", name: "TiendaVerde" })],
      total: 1,
      page: 1,
      limit: 50,
    });
    const { findByText, queryByText } = renderWithClient(<RecordingModal />);
    fireEvent.press(await findByText("TiendaVerde"));
    expect(await findByText(/tap to record/i)).toBeTruthy();
    await waitFor(() => {
      expect(queryByText(/choose a project/i)).toBeNull();
    });
  });

  it("dismisses the modal when the close button is pressed in idle state", async () => {
    mockParams = { projectId: "p1" };
    listProjectsMock.mockResolvedValueOnce({
      data: [buildProject()],
      total: 1,
      page: 1,
      limit: 50,
    });
    const { findByLabelText } = renderWithClient(<RecordingModal />);
    fireEvent.press(await findByLabelText("Close recorder"));
    expect(mockDismiss).toHaveBeenCalled();
  });
});
