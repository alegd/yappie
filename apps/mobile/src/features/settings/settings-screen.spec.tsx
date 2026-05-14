jest.mock("@/lib/api/jira", () => ({
  getJiraStatus: jest.fn(),
  startJiraAuth: jest.fn(),
  disconnectJira: jest.fn(),
}));

jest.mock("@/lib/api/quotas", () => ({
  getQuota: jest.fn(),
}));

const mockOpenAuthSessionAsync = jest.fn();
jest.mock("expo-web-browser", () => ({
  openAuthSessionAsync: (...args: unknown[]) => mockOpenAuthSessionAsync(...args),
}));

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}
const mockAlert = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Alert } = require("react-native") as typeof import("react-native");
jest.spyOn(Alert, "alert").mockImplementation(((
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => mockAlert(title, message, buttons)) as typeof Alert.alert);

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
const startJiraAuthMock = jiraApi.startJiraAuth as jest.Mock;
const disconnectJiraMock = jiraApi.disconnectJira as jest.Mock;
const getQuotaMock = quotasApi.getQuota as jest.Mock;

const QUOTA_RESPONSE = {
  plan: "FREE",
  limitMinutes: 20,
  usedMinutes: 5,
  remainingMinutes: 15,
  cycleStartDate: "2026-05-01",
  cycleEndDate: "2026-05-31",
};

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return { ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>), client };
}

describe("SettingsScreen", () => {
  beforeEach(() => {
    getJiraStatusMock.mockReset();
    startJiraAuthMock.mockReset();
    disconnectJiraMock.mockReset();
    mockOpenAuthSessionAsync.mockReset();
    mockAlert.mockReset();
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
    getQuotaMock.mockResolvedValueOnce(QUOTA_RESPONSE);
    const { findByText } = renderWithClient(<SettingsScreen />);
    fireEvent.press(await findByText("Sign out"));
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe("Jira connect flow", () => {
    it("opens an auth session with the Atlassian URL when Connect Jira is pressed", async () => {
      getJiraStatusMock.mockResolvedValueOnce({ connected: false });
      getQuotaMock.mockResolvedValueOnce(QUOTA_RESPONSE);
      startJiraAuthMock.mockResolvedValueOnce({ url: "https://auth.atlassian.com/x" });
      mockOpenAuthSessionAsync.mockResolvedValueOnce({ type: "cancel" });

      const { findByText } = renderWithClient(<SettingsScreen />);
      fireEvent.press(await findByText("Connect Jira"));

      await waitFor(() => {
        expect(startJiraAuthMock).toHaveBeenCalledWith("yappie://settings");
      });
      await waitFor(() => {
        expect(mockOpenAuthSessionAsync).toHaveBeenCalledWith(
          "https://auth.atlassian.com/x",
          "yappie://settings",
        );
      });
    });

    it("refetches Jira status after a successful auth session", async () => {
      getJiraStatusMock
        .mockResolvedValueOnce({ connected: false })
        .mockResolvedValueOnce({ connected: true });
      getQuotaMock.mockResolvedValueOnce(QUOTA_RESPONSE);
      startJiraAuthMock.mockResolvedValueOnce({ url: "https://auth.atlassian.com/x" });
      mockOpenAuthSessionAsync.mockResolvedValueOnce({
        type: "success",
        url: "yappie://settings?jira=connected",
      });

      const { findByText } = renderWithClient(<SettingsScreen />);
      fireEvent.press(await findByText("Connect Jira"));

      await waitFor(() => {
        expect(getJiraStatusMock).toHaveBeenCalledTimes(2);
      });
    });

    it("invalidates the Jira projects cache after a successful connect", async () => {
      getJiraStatusMock.mockResolvedValue({ connected: false });
      getQuotaMock.mockResolvedValueOnce(QUOTA_RESPONSE);
      startJiraAuthMock.mockResolvedValueOnce({ url: "https://auth.atlassian.com/x" });
      mockOpenAuthSessionAsync.mockResolvedValueOnce({
        type: "success",
        url: "yappie://settings?jira=connected",
      });
      const { findByText, client } = renderWithClient(<SettingsScreen />);
      const invalidateSpy = jest.spyOn(client, "invalidateQueries");
      fireEvent.press(await findByText("Connect Jira"));
      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["jira", "projects"] });
      });
    });
  });

  describe("Jira disconnect flow", () => {
    it("shows a Disconnect button when Jira is connected", async () => {
      getJiraStatusMock.mockResolvedValueOnce({ connected: true });
      getQuotaMock.mockResolvedValueOnce(QUOTA_RESPONSE);
      const { findByText } = renderWithClient(<SettingsScreen />);
      expect(await findByText("Disconnect Jira")).toBeTruthy();
    });

    it("calls disconnectJira and refetches status when user confirms", async () => {
      getJiraStatusMock
        .mockResolvedValueOnce({ connected: true })
        .mockResolvedValueOnce({ connected: false });
      getQuotaMock.mockResolvedValueOnce(QUOTA_RESPONSE);
      disconnectJiraMock.mockResolvedValueOnce(undefined);

      const { findByText } = renderWithClient(<SettingsScreen />);
      fireEvent.press(await findByText("Disconnect Jira"));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      });
      const buttons = mockAlert.mock.calls[0][2] as AlertButton[];
      const confirmButton = buttons.find((b) => b.style === "destructive");
      confirmButton?.onPress?.();

      await waitFor(() => {
        expect(disconnectJiraMock).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(getJiraStatusMock).toHaveBeenCalledTimes(2);
      });
    });

    it("does not call disconnectJira when user cancels", async () => {
      getJiraStatusMock.mockResolvedValueOnce({ connected: true });
      getQuotaMock.mockResolvedValueOnce(QUOTA_RESPONSE);

      const { findByText } = renderWithClient(<SettingsScreen />);
      fireEvent.press(await findByText("Disconnect Jira"));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      });
      const buttons = mockAlert.mock.calls[0][2] as AlertButton[];
      const cancelButton = buttons.find((b) => b.style === "cancel");
      cancelButton?.onPress?.();

      expect(disconnectJiraMock).not.toHaveBeenCalled();
    });

    it("invalidates the Jira projects cache after a confirmed disconnect", async () => {
      getJiraStatusMock.mockResolvedValue({ connected: true });
      getQuotaMock.mockResolvedValueOnce(QUOTA_RESPONSE);
      disconnectJiraMock.mockResolvedValueOnce(undefined);

      const { findByText, client } = renderWithClient(<SettingsScreen />);
      const invalidateSpy = jest.spyOn(client, "invalidateQueries");
      fireEvent.press(await findByText("Disconnect Jira"));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalled();
      });
      const buttons = mockAlert.mock.calls[0][2] as AlertButton[];
      const confirmButton = buttons.find((b) => b.style === "destructive");
      confirmButton?.onPress?.();

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["jira", "projects"] });
      });
    });
  });
});
