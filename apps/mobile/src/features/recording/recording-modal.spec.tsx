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

// expo-audio mocked at module level. Tests control behavior via the
// mockRecorderHandle and mockPermissionState below.
const mockRecorderHandle = {
  prepareToRecordAsync: jest.fn(),
  record: jest.fn(),
  stop: jest.fn().mockResolvedValue(undefined),
  uri: "file:///tmp/test.m4a",
};

let mockPermissionState: { granted: boolean; canAskAgain: boolean; status: string } = {
  granted: true,
  canAskAgain: true,
  status: "granted",
};
const mockRequestPermission = jest.fn();

jest.mock("expo-audio", () => ({
  useAudioRecorder: () => mockRecorderHandle,
  useAudioRecorderPermissions: () => [mockPermissionState, mockRequestPermission],
  RecordingPresets: { HIGH_QUALITY: {} },
}));

jest.mock("react-native/Libraries/Linking/Linking", () => ({
  openSettings: jest.fn(),
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
    mockRecorderHandle.prepareToRecordAsync.mockReset();
    mockRecorderHandle.record.mockReset();
    mockRecorderHandle.stop.mockReset().mockResolvedValue(undefined);
    mockRequestPermission.mockReset();
    mockPermissionState = { granted: true, canAskAgain: true, status: "granted" };
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

  describe("permissions and recorder wiring", () => {
    it("shows the permission denied screen when mic permission is not granted", async () => {
      mockPermissionState = { granted: false, canAskAgain: false, status: "denied" };
      mockParams = { projectId: "p1" };
      listProjectsMock.mockResolvedValueOnce({
        data: [buildProject()],
        total: 1,
        page: 1,
        limit: 50,
      });
      const { findByText } = renderWithClient(<RecordingModal />);
      expect(await findByText(/microphone access/i)).toBeTruthy();
      expect(await findByText(/open settings/i)).toBeTruthy();
    });

    it("requests permission and transitions to idle when granted on first record press", async () => {
      mockPermissionState = { granted: false, canAskAgain: true, status: "undetermined" };
      mockRequestPermission.mockResolvedValueOnce({
        granted: true,
        canAskAgain: true,
        status: "granted",
      });
      mockParams = { projectId: "p1" };
      listProjectsMock.mockResolvedValueOnce({
        data: [buildProject()],
        total: 1,
        page: 1,
        limit: 50,
      });
      const { findByLabelText, findByText } = renderWithClient(<RecordingModal />);
      fireEvent.press(await findByLabelText("Grant microphone access"));
      await waitFor(() => {
        expect(mockRequestPermission).toHaveBeenCalled();
      });
      expect(await findByText(/tap to record/i)).toBeTruthy();
    });

    it("calls prepareToRecordAsync and record when Record is pressed", async () => {
      mockParams = { projectId: "p1" };
      listProjectsMock.mockResolvedValueOnce({
        data: [buildProject()],
        total: 1,
        page: 1,
        limit: 50,
      });
      const { findByLabelText } = renderWithClient(<RecordingModal />);
      fireEvent.press(await findByLabelText("Start recording"));
      await waitFor(() => {
        expect(mockRecorderHandle.prepareToRecordAsync).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(mockRecorderHandle.record).toHaveBeenCalled();
      });
    });

    it("calls recorder.stop when Stop is pressed", async () => {
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
      await waitFor(() => {
        expect(mockRecorderHandle.stop).toHaveBeenCalled();
      });
    });
  });
});
