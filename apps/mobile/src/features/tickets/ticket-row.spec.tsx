import { render, fireEvent } from "@testing-library/react-native";
import { TicketRow } from "./ticket-row";
import type { Ticket } from "@/lib/api/types";

function buildTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: "t1",
    title: "Fix login bug in Safari",
    description: "Description",
    status: "DRAFT",
    priority: "CRITICAL",
    jiraIssueKey: null,
    jiraIssueUrl: null,
    audioRecordingId: "a1",
    projectId: "p1",
    createdAt: "2026-05-12T10:00:00Z",
    updatedAt: "2026-05-12T10:00:00Z",
    ...overrides,
  };
}

describe("TicketRow", () => {
  it("renders the title", () => {
    const { getByText } = render(<TicketRow ticket={buildTicket()} onPress={() => {}} />);
    expect(getByText("Fix login bug in Safari")).toBeTruthy();
  });

  it("renders priority and status badges", () => {
    const { getByText } = render(<TicketRow ticket={buildTicket()} onPress={() => {}} />);
    expect(getByText("CRITICAL")).toBeTruthy();
    expect(getByText("DRAFT")).toBeTruthy();
  });

  it("renders the jira issue key when status is EXPORTED", () => {
    const { getByText } = render(
      <TicketRow
        ticket={buildTicket({ status: "EXPORTED", jiraIssueKey: "TV-42" })}
        onPress={() => {}}
      />,
    );
    expect(getByText("TV-42")).toBeTruthy();
  });

  it("fires onPress when tapped", () => {
    const onPress = jest.fn();
    const { getByText } = render(<TicketRow ticket={buildTicket()} onPress={onPress} />);
    fireEvent.press(getByText("Fix login bug in Safari"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("shows a checkbox indicator when selectable", () => {
    const { getByTestId } = render(
      <TicketRow ticket={buildTicket()} onPress={() => {}} selectable />,
    );
    expect(getByTestId("ticket-checkbox")).toBeTruthy();
  });

  it("marks the checkbox as selected when selected prop is true", () => {
    const { getByTestId } = render(
      <TicketRow ticket={buildTicket()} onPress={() => {}} selectable selected />,
    );
    expect(getByTestId("ticket-checkbox").props.accessibilityState).toMatchObject({
      checked: true,
    });
  });
});
