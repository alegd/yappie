const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/api/audios", () => ({
  listRecentAudios: jest.fn(),
}));

jest.mock("@/lib/api/quotas", () => ({
  getQuota: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, fireEvent, waitFor } = require("@testing-library/react-native") as typeof import("@testing-library/react-native");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query") as typeof import("@tanstack/react-query");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const audiosApi = require("@/lib/api/audios") as typeof import("@/lib/api/audios");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const quotasApi = require("@/lib/api/quotas") as typeof import("@/lib/api/quotas");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { HomeScreen } = require("./home-screen") as typeof import("./home-screen");

const listRecentAudiosMock = audiosApi.listRecentAudios as jest.Mock;
const getQuotaMock = quotasApi.getQuota as jest.Mock;

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

function buildQuota(overrides = {}) {
  return {
    plan: "FREE" as const,
    limitMinutes: 20,
    usedMinutes: 5,
    remainingMinutes: 15,
    cycleStartDate: "2026-05-01",
    cycleEndDate: "2026-05-31",
    ...overrides,
  };
}

function buildAudio(overrides: Partial<{ id: string; fileName: string }> = {}) {
  return {
    id: overrides.id ?? "a1",
    fileName: overrides.fileName ?? "standup.m4a",
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

describe("HomeScreen", () => {
  beforeEach(() => {
    listRecentAudiosMock.mockReset();
    getQuotaMock.mockReset();
    mockPush.mockReset();
  });

  it("renders the quota widget when quota loads", async () => {
    getQuotaMock.mockResolvedValueOnce(buildQuota({ usedMinutes: 8, limitMinutes: 20 }));
    listRecentAudiosMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 10 });
    const { findByText } = renderWithClient(<HomeScreen />);
    expect(await findByText("8 / 20 min")).toBeTruthy();
  });

  it("renders recent audios", async () => {
    getQuotaMock.mockResolvedValueOnce(buildQuota());
    listRecentAudiosMock.mockResolvedValueOnce({
      data: [
        buildAudio({ id: "a1", fileName: "audio-one.m4a" }),
        buildAudio({ id: "a2", fileName: "audio-two.m4a" }),
      ],
      total: 2,
      page: 1,
      limit: 10,
    });
    const { findByText } = renderWithClient(<HomeScreen />);
    expect(await findByText("audio-one.m4a")).toBeTruthy();
    expect(await findByText("audio-two.m4a")).toBeTruthy();
  });

  it("shows an empty state when there are no recent audios", async () => {
    getQuotaMock.mockResolvedValueOnce(buildQuota());
    listRecentAudiosMock.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 10 });
    const { findByText } = renderWithClient(<HomeScreen />);
    expect(await findByText(/no audios yet/i)).toBeTruthy();
  });

  it("pushes to /audios/<id> when an audio row is tapped", async () => {
    getQuotaMock.mockResolvedValueOnce(buildQuota());
    listRecentAudiosMock.mockResolvedValueOnce({
      data: [buildAudio({ id: "a1", fileName: "audio.m4a" })],
      total: 1,
      page: 1,
      limit: 10,
    });
    const { findByText } = renderWithClient(<HomeScreen />);
    fireEvent.press(await findByText("audio.m4a"));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/audios/a1");
    });
  });
});
