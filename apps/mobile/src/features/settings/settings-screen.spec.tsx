jest.mock("@/lib/api/jira", () => ({
  getJiraStatus: jest.fn(),
}));

jest.mock("@/lib/api/quotas", () => ({
  getQuota: jest.fn(),
}));

const mockLogout = jest.fn().mockResolvedValue(undefined);
jest.mock("@/features/auth/use-auth", () => ({
  useAuth: () => ({
    logout: { mutate: mockLogout, mutateAsync: mockLogout, isPending: false },
  }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, fireEvent, waitFor } = require("@testing-library/react-native") as typeof import("@testing-library/react-native");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query") as typeof import("@tanstack/react-query");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jiraApi = require("@/lib/api/jira") as typeof import("@/lib/api/jira");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const quotasApi = require("@/lib/api/quotas") as typeof import("@/lib/api/quotas");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useAuthStore } = require("@/features/auth/auth-store") as typeof import("@/features/auth/auth-store");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SettingsScreen } = require("./settings-screen") as typeof import("./settings-screen");

const getJiraStatusMock = jiraApi.getJiraStatus as jest.Mock;
const getQuotaMock = quotasApi.getQuota as jest.Mock;

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("SettingsScreen", () => {
  beforeEach(() => {
    getJiraStatusMock.mockReset();
    getQuotaMock.mockReset();
    mockLogout.mockClear();
    useAuthStore.setState({
      accessToken: "tok",
      user: { id: "u1", email: "ale@yappie.com", name: "Ale" },
      hydrated: true,
    });
  });

  it("renders the user's name and email", async () => {
    getJiraStatusMock.mockResolvedValueOnce({ connected: false });
    getQuotaMock.mockResolvedValueOnce({
      plan: "FREE",
      limitMinutes: 20,
      usedMinutes: 5,
      remainingMinutes: 15,
      cycleStartDate: "2026-05-01",
      cycleEndDate: "2026-05-31",
    });
    const { findByText } = renderWithClient(<SettingsScreen />);
    expect(await findByText("Ale")).toBeTruthy();
    expect(await findByText("ale@yappie.com")).toBeTruthy();
  });

  it("shows the Jira Connect button when not connected", async () => {
    getJiraStatusMock.mockResolvedValueOnce({ connected: false });
    getQuotaMock.mockResolvedValueOnce({
      plan: "FREE",
      limitMinutes: 20,
      usedMinutes: 5,
      remainingMinutes: 15,
      cycleStartDate: "2026-05-01",
      cycleEndDate: "2026-05-31",
    });
    const { findByText } = renderWithClient(<SettingsScreen />);
    expect(await findByText("Connect Jira")).toBeTruthy();
  });

  it("shows Jira as connected when status returns connected=true", async () => {
    getJiraStatusMock.mockResolvedValueOnce({ connected: true });
    getQuotaMock.mockResolvedValueOnce({
      plan: "FREE",
      limitMinutes: 20,
      usedMinutes: 5,
      remainingMinutes: 15,
      cycleStartDate: "2026-05-01",
      cycleEndDate: "2026-05-31",
    });
    const { findByText } = renderWithClient(<SettingsScreen />);
    expect(await findByText(/connected/i)).toBeTruthy();
  });

  it("calls the logout mutation when Sign out is pressed", async () => {
    getJiraStatusMock.mockResolvedValueOnce({ connected: true });
    getQuotaMock.mockResolvedValueOnce({
      plan: "FREE",
      limitMinutes: 20,
      usedMinutes: 5,
      remainingMinutes: 15,
      cycleStartDate: "2026-05-01",
      cycleEndDate: "2026-05-31",
    });
    const { findByText } = renderWithClient(<SettingsScreen />);
    fireEvent.press(await findByText("Sign out"));
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });
});
