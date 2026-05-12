// @gorhom/bottom-sheet is mocked globally in jest-setup.js.
import { Alert } from "react-native";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/api/tickets", () => ({
  updateTicket: jest.fn(),
  deleteTicket: jest.fn(),
}));

jest.mock("@/lib/api/jira", () => ({
  exportTicketToJira: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { render, fireEvent, waitFor } = require("@testing-library/react-native") as typeof import("@testing-library/react-native");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query") as typeof import("@tanstack/react-query");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ticketsApi = require("@/lib/api/tickets") as typeof import("@/lib/api/tickets");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const jiraApi = require("@/lib/api/jira") as typeof import("@/lib/api/jira");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { ApiError } = require("@/lib/api-error") as typeof import("@/lib/api-error");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TicketDetailSheet } = require("./ticket-detail-sheet") as typeof import("./ticket-detail-sheet");

const updateTicketMock = ticketsApi.updateTicket as jest.Mock;
const deleteTicketMock = ticketsApi.deleteTicket as jest.Mock;
const exportToJiraMock = jiraApi.exportTicketToJira as jest.Mock;

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>),
    client,
  };
}

function buildTicket(overrides: Partial<import("@/lib/api/types").Ticket> = {}): import("@/lib/api/types").Ticket {
  return {
    id: "t1",
    title: "Fix login bug in Safari",
    description: "Description text",
    status: "DRAFT",
    priority: "CRITICAL",
    jiraIssueKey: null,
    jiraIssueUrl: null,
    audioRecordingId: "a1",
    projectId: "p1",
    createdAt: "2026-05-12",
    updatedAt: "2026-05-12",
    ...overrides,
  };
}

describe("TicketDetailSheet", () => {
  beforeEach(() => {
    updateTicketMock.mockReset();
    deleteTicketMock.mockReset();
    exportToJiraMock.mockReset();
    mockPush.mockReset();
    jest.restoreAllMocks();
  });

  it("renders nothing when ticket is null", () => {
    const { queryByTestId } = renderWithClient(
      <TicketDetailSheet ticket={null} onClose={() => {}} />,
    );
    expect(queryByTestId("bottom-sheet")).toBeNull();
  });

  it("renders the ticket title, description, and badges", () => {
    const { getByText } = renderWithClient(
      <TicketDetailSheet ticket={buildTicket()} onClose={() => {}} />,
    );
    expect(getByText("Fix login bug in Safari")).toBeTruthy();
    expect(getByText("Description text")).toBeTruthy();
    expect(getByText("CRITICAL")).toBeTruthy();
    expect(getByText("DRAFT")).toBeTruthy();
  });

  it("renders the Jira issue key when status is EXPORTED", () => {
    const { getByText } = renderWithClient(
      <TicketDetailSheet
        ticket={buildTicket({ status: "EXPORTED", jiraIssueKey: "TV-42" })}
        onClose={() => {}}
      />,
    );
    expect(getByText("TV-42")).toBeTruthy();
  });

  it("calls onClose when the close button is pressed", () => {
    const onClose = jest.fn();
    const { getByLabelText } = renderWithClient(
      <TicketDetailSheet ticket={buildTicket()} onClose={onClose} />,
    );
    fireEvent.press(getByLabelText("Close ticket detail"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe("delete", () => {
    it("confirms before deleting and calls deleteTicket on confirm", async () => {
      deleteTicketMock.mockResolvedValueOnce(undefined);
      jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
        const destructive = buttons?.find((b) => b.style === "destructive");
        destructive?.onPress?.();
      });
      const onClose = jest.fn();
      const { getByText } = renderWithClient(
        <TicketDetailSheet ticket={buildTicket()} onClose={onClose} />,
      );
      fireEvent.press(getByText("Delete"));
      await waitFor(() => {
        expect(deleteTicketMock).toHaveBeenCalledWith("t1");
      });
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it("does NOT delete if the user cancels the confirmation", () => {
      jest.spyOn(Alert, "alert").mockImplementation((_title, _msg, buttons) => {
        const cancel = buttons?.find((b) => b.style === "cancel");
        cancel?.onPress?.();
      });
      const { getByText } = renderWithClient(
        <TicketDetailSheet ticket={buildTicket()} onClose={() => {}} />,
      );
      fireEvent.press(getByText("Delete"));
      expect(deleteTicketMock).not.toHaveBeenCalled();
    });
  });

  describe("edit", () => {
    it("enters edit mode and shows inputs prefilled with current values", () => {
      const { getByText, getByDisplayValue } = renderWithClient(
        <TicketDetailSheet ticket={buildTicket()} onClose={() => {}} />,
      );
      fireEvent.press(getByText("Edit"));
      expect(getByDisplayValue("Fix login bug in Safari")).toBeTruthy();
      expect(getByDisplayValue("Description text")).toBeTruthy();
    });

    it("saves edits via updateTicket and exits edit mode", async () => {
      updateTicketMock.mockResolvedValueOnce({
        ...buildTicket(),
        title: "Renamed",
        priority: "MEDIUM",
      });
      const { getByText, getByDisplayValue, findByText } = renderWithClient(
        <TicketDetailSheet ticket={buildTicket()} onClose={() => {}} />,
      );
      fireEvent.press(getByText("Edit"));
      fireEvent.changeText(getByDisplayValue("Fix login bug in Safari"), "Renamed");
      fireEvent.press(getByText("MEDIUM"));
      fireEvent.press(getByText("Save"));
      await waitFor(() => {
        expect(updateTicketMock).toHaveBeenCalledWith("t1", {
          title: "Renamed",
          description: "Description text",
          priority: "MEDIUM",
        });
      });
      expect(await findByText("Edit")).toBeTruthy(); // back to read mode
    });

    it("cancel reverts edits and returns to read mode without saving", () => {
      const { getByText, getByDisplayValue, queryByDisplayValue } = renderWithClient(
        <TicketDetailSheet ticket={buildTicket()} onClose={() => {}} />,
      );
      fireEvent.press(getByText("Edit"));
      fireEvent.changeText(getByDisplayValue("Fix login bug in Safari"), "Renamed");
      fireEvent.press(getByText("Cancel"));
      expect(updateTicketMock).not.toHaveBeenCalled();
      expect(queryByDisplayValue("Renamed")).toBeNull();
      expect(getByText("Edit")).toBeTruthy();
    });
  });

  describe("export to Jira", () => {
    it("renders the Export action when ticket is not yet exported", () => {
      const { getByText } = renderWithClient(
        <TicketDetailSheet ticket={buildTicket()} onClose={() => {}} />,
      );
      expect(getByText("Export to Jira")).toBeTruthy();
    });

    it("hides the Export action when ticket is already exported", () => {
      const { queryByText } = renderWithClient(
        <TicketDetailSheet
          ticket={buildTicket({ status: "EXPORTED", jiraIssueKey: "TV-1" })}
          onClose={() => {}}
        />,
      );
      expect(queryByText("Export to Jira")).toBeNull();
    });

    it("calls exportTicketToJira and invalidates audio cache on success", async () => {
      exportToJiraMock.mockResolvedValueOnce({ jiraIssueKey: "TV-1", jiraIssueUrl: "https://j.io" });
      const { getByText } = renderWithClient(
        <TicketDetailSheet ticket={buildTicket()} onClose={() => {}} />,
      );
      fireEvent.press(getByText("Export to Jira"));
      await waitFor(() => {
        expect(exportToJiraMock).toHaveBeenCalledWith("t1");
      });
    });

    it("shows a Connect Jira alert on 403 and routes to settings if user confirms", async () => {
      exportToJiraMock.mockRejectedValueOnce(new ApiError(403, null, "Jira not connected"));
      const alertSpy = jest.spyOn(Alert, "alert").mockImplementation((_t, _m, buttons) => {
        const connect = buttons?.find((b) => b.text === "Connect");
        connect?.onPress?.();
      });
      const { getByText } = renderWithClient(
        <TicketDetailSheet ticket={buildTicket()} onClose={() => {}} />,
      );
      fireEvent.press(getByText("Export to Jira"));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/settings");
      });
    });
  });
});
