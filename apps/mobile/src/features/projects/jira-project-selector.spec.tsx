jest.mock("@/lib/api/jira", () => ({
  getJiraStatus: jest.fn(),
  getJiraProjects: jest.fn(),
}));

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, fireEvent, waitFor } = require("@testing-library/react-native") as typeof import("@testing-library/react-native");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query") as typeof import("@tanstack/react-query");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jiraApi = require("@/lib/api/jira") as typeof import("@/lib/api/jira");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { JiraProjectSelector } = require("./jira-project-selector") as typeof import("./jira-project-selector");

const getJiraStatusMock = jiraApi.getJiraStatus as jest.Mock;
const getJiraProjectsMock = jiraApi.getJiraProjects as jest.Mock;

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("JiraProjectSelector", () => {
  beforeEach(() => {
    getJiraStatusMock.mockReset();
    getJiraProjectsMock.mockReset();
    mockPush.mockReset();
  });

  it("shows a Connect Jira CTA when Jira is not connected", async () => {
    getJiraStatusMock.mockResolvedValueOnce({ connected: false });
    const { findByLabelText } = renderWithClient(
      <JiraProjectSelector value={null} onChange={() => {}} />,
    );
    expect(await findByLabelText("Connect Jira in Settings")).toBeTruthy();
  });

  it("navigates to Settings when the CTA is pressed", async () => {
    getJiraStatusMock.mockResolvedValueOnce({ connected: false });
    const { findByLabelText } = renderWithClient(
      <JiraProjectSelector value={null} onChange={() => {}} />,
    );
    fireEvent.press(await findByLabelText("Connect Jira in Settings"));
    expect(mockPush).toHaveBeenCalledWith("/settings");
  });

  it("shows the placeholder and expands the project list when connected", async () => {
    getJiraStatusMock.mockResolvedValueOnce({ connected: true });
    getJiraProjectsMock.mockResolvedValueOnce([
      { id: "1", key: "TV", name: "TiendaVerde" },
      { id: "2", key: "APP", name: "App" },
    ]);
    const { findByLabelText, findByText } = renderWithClient(
      <JiraProjectSelector value={null} onChange={() => {}} />,
    );
    fireEvent.press(await findByLabelText("Select Jira project"));
    expect(await findByText("TV — TiendaVerde")).toBeTruthy();
    expect(await findByText("APP — App")).toBeTruthy();
  });

  it("calls onChange with the project key when an option is selected", async () => {
    getJiraStatusMock.mockResolvedValueOnce({ connected: true });
    getJiraProjectsMock.mockResolvedValueOnce([{ id: "1", key: "TV", name: "TiendaVerde" }]);
    const onChange = jest.fn();
    const { findByLabelText } = renderWithClient(
      <JiraProjectSelector value={null} onChange={onChange} />,
    );
    fireEvent.press(await findByLabelText("Select Jira project"));
    fireEvent.press(await findByLabelText("Jira project TV"));
    expect(onChange).toHaveBeenCalledWith("TV");
  });

  it("shows a retry affordance when the projects query fails", async () => {
    getJiraStatusMock.mockResolvedValueOnce({ connected: true });
    getJiraProjectsMock.mockRejectedValueOnce(new Error("token expired"));
    const { findByLabelText } = renderWithClient(
      <JiraProjectSelector value={null} onChange={() => {}} />,
    );
    expect(await findByLabelText("Retry loading Jira projects")).toBeTruthy();
  });
});
