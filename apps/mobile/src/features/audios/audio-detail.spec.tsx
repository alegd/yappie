const mockPush = jest.fn();
const mockBack = jest.fn();
let mockParams: Record<string, string> = { id: "a1" };

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock("@/lib/api/audios", () => ({
  getAudio: jest.fn(),
}));

jest.mock("@/lib/api/jira", () => ({
  exportTicketsBulk: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, fireEvent, waitFor } = require("@testing-library/react-native") as typeof import("@testing-library/react-native");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query") as typeof import("@tanstack/react-query");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audiosApi = require("@/lib/api/audios") as typeof import("@/lib/api/audios");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jiraApi = require("@/lib/api/jira") as typeof import("@/lib/api/jira");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { AudioDetail } = require("./audio-detail") as typeof import("./audio-detail");

const getAudioMock = audiosApi.getAudio as jest.Mock;
const exportBulkMock = jiraApi.exportTicketsBulk as jest.Mock;

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function buildAudio(overrides: Partial<{ id: string; fileName: string; transcription: string | null; tickets: unknown[] }> = {}) {
  return {
    id: overrides.id ?? "a1",
    fileName: overrides.fileName ?? "standup.m4a",
    fileSize: 1,
    mimeType: "audio/mp4",
    duration: 47,
    status: "COMPLETED" as const,
    transcription: overrides.transcription ?? null,
    errorMessage: null,
    projectId: "p1",
    createdAt: "2026-05-12T10:00:00Z",
    updatedAt: "2026-05-12T10:00:00Z",
    tickets: overrides.tickets ?? [],
  };
}

function buildTicket(overrides: Partial<{ id: string; title: string }> = {}) {
  return {
    id: overrides.id ?? "t1",
    title: overrides.title ?? "Fix login bug",
    description: "...",
    status: "DRAFT" as const,
    priority: "HIGH" as const,
    jiraIssueKey: null,
    jiraIssueUrl: null,
    audioRecordingId: "a1",
    projectId: "p1",
    createdAt: "2026-05-12T10:00:00Z",
    updatedAt: "2026-05-12T10:00:00Z",
  };
}

describe("AudioDetail", () => {
  beforeEach(() => {
    getAudioMock.mockReset();
    exportBulkMock.mockReset();
    mockPush.mockReset();
    mockBack.mockReset();
    mockParams = { id: "a1" };
  });

  it("renders the file name and status", async () => {
    getAudioMock.mockResolvedValueOnce(buildAudio({ fileName: "standup.m4a" }));
    const { findByText } = renderWithClient(<AudioDetail />);
    expect(await findByText("standup.m4a")).toBeTruthy();
    expect(await findByText("COMPLETED")).toBeTruthy();
  });

  it("renders the transcription when present", async () => {
    getAudioMock.mockResolvedValueOnce(buildAudio({ transcription: "Hello world" }));
    const { findByText, queryByText } = renderWithClient(<AudioDetail />);
    expect(await findByText(/show transcription/i)).toBeTruthy();
    expect(queryByText("Hello world")).toBeNull(); // collapsed
  });

  it("renders one row per ticket", async () => {
    getAudioMock.mockResolvedValueOnce(
      buildAudio({
        tickets: [
          buildTicket({ id: "t1", title: "Ticket A" }),
          buildTicket({ id: "t2", title: "Ticket B" }),
        ],
      }),
    );
    const { findByText } = renderWithClient(<AudioDetail />);
    expect(await findByText("Ticket A")).toBeTruthy();
    expect(await findByText("Ticket B")).toBeTruthy();
  });

  it("toggles select mode and shows the footer with count when items selected", async () => {
    getAudioMock.mockResolvedValueOnce(
      buildAudio({
        tickets: [buildTicket({ id: "t1", title: "Ticket A" })],
      }),
    );
    const { findByText, getByText, queryByText } = renderWithClient(<AudioDetail />);
    // Wait for tickets to render
    await findByText("Ticket A");
    expect(queryByText(/selected/i)).toBeNull();
    fireEvent.press(getByText(/select multiple/i));
    fireEvent.press(getByText("Ticket A"));
    expect(getByText(/1 selected/i)).toBeTruthy();
  });

  it("shows an empty state when there are no tickets", async () => {
    getAudioMock.mockResolvedValueOnce(buildAudio({ tickets: [] }));
    const { findByText } = renderWithClient(<AudioDetail />);
    expect(await findByText(/no tickets/i)).toBeTruthy();
  });

  describe("bulk export", () => {
    it("calls exportTicketsBulk with the selected ids and exits select mode on success", async () => {
      getAudioMock.mockResolvedValueOnce(
        buildAudio({
          tickets: [
            buildTicket({ id: "t1", title: "Ticket A" }),
            buildTicket({ id: "t2", title: "Ticket B" }),
          ],
        }),
      );
      exportBulkMock.mockResolvedValueOnce(undefined);
      const { findByText, getByText, queryByText } = renderWithClient(<AudioDetail />);
      await findByText("Ticket A");
      fireEvent.press(getByText(/select multiple/i));
      fireEvent.press(getByText("Ticket A"));
      fireEvent.press(getByText("Ticket B"));
      fireEvent.press(getByText(/export to jira/i));
      await waitFor(() => {
        expect(exportBulkMock).toHaveBeenCalledWith(["t1", "t2"]);
      });
      await waitFor(() => {
        expect(queryByText(/selected/i)).toBeNull();
      });
    });
  });
});
