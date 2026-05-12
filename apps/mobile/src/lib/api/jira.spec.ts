jest.mock("./client", () => ({
  apiFetch: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const client = require("./client") as typeof import("./client");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jira = require("./jira") as typeof import("./jira");

const apiFetchMock = client.apiFetch as jest.Mock;

describe("jira API", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("exportTicketToJira posts to /integrations/jira/export/:ticketId", async () => {
    apiFetchMock.mockResolvedValueOnce({ jiraIssueKey: "TV-1", jiraIssueUrl: "https://..." });
    await jira.exportTicketToJira("t1");
    expect(apiFetchMock).toHaveBeenCalledWith("/integrations/jira/export/t1", {
      method: "POST",
    });
  });

  it("exportTicketsBulk posts ticketIds to /integrations/jira/export-bulk", async () => {
    apiFetchMock.mockResolvedValueOnce({ ok: true });
    await jira.exportTicketsBulk(["t1", "t2"]);
    expect(apiFetchMock).toHaveBeenCalledWith("/integrations/jira/export-bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketIds: ["t1", "t2"] }),
    });
  });

  it("getJiraStatus calls GET /integrations/jira/status", async () => {
    apiFetchMock.mockResolvedValueOnce({ connected: true });
    await jira.getJiraStatus();
    expect(apiFetchMock).toHaveBeenCalledWith("/integrations/jira/status");
  });
});
