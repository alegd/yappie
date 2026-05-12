// Note: @gorhom/bottom-sheet is mocked globally in jest-setup.js.
import { render, fireEvent } from "@testing-library/react-native";
import { TicketDetailSheet } from "./ticket-detail-sheet";
import type { Ticket } from "@/lib/api/types";

function buildTicket(overrides: Partial<Ticket> = {}): Ticket {
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
  it("renders nothing when ticket is null", () => {
    const { queryByTestId } = render(
      <TicketDetailSheet ticket={null} onClose={() => {}} />,
    );
    expect(queryByTestId("bottom-sheet")).toBeNull();
  });

  it("renders the ticket title, description, and badges", () => {
    const { getByText } = render(
      <TicketDetailSheet ticket={buildTicket()} onClose={() => {}} />,
    );
    expect(getByText("Fix login bug in Safari")).toBeTruthy();
    expect(getByText("Description text")).toBeTruthy();
    expect(getByText("CRITICAL")).toBeTruthy();
    expect(getByText("DRAFT")).toBeTruthy();
  });

  it("renders the Jira issue key when status is EXPORTED", () => {
    const { getByText } = render(
      <TicketDetailSheet
        ticket={buildTicket({ status: "EXPORTED", jiraIssueKey: "TV-42" })}
        onClose={() => {}}
      />,
    );
    expect(getByText("TV-42")).toBeTruthy();
  });

  it("calls onClose when the close button is pressed", () => {
    const onClose = jest.fn();
    const { getByLabelText } = render(
      <TicketDetailSheet ticket={buildTicket()} onClose={onClose} />,
    );
    fireEvent.press(getByLabelText("Close ticket detail"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
