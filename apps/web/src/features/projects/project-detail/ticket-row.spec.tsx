import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TicketRow } from "./ticket-row";
import type { Ticket } from "@/features/tickets/types";

const baseTicket: Ticket = {
  id: "t-1",
  title: "Fix bug",
  description: "desc",
  status: "DRAFT",
  priority: "HIGH",
  jiraIssueKey: null,
  jiraIssueUrl: null,
  audioRecordingId: "a-1",
  projectId: "p-1",
  createdAt: "2026-06-10T10:00:00.000Z",
  updatedAt: "2026-06-10T10:00:00.000Z",
};

describe("TicketRow", () => {
  it("renders title as a button and the badges", () => {
    render(
      <TicketRow
        ticket={baseTicket}
        isSelected={false}
        onToggle={vi.fn()}
        onTitleClick={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Fix bug" })).toBeInTheDocument();
    expect(screen.getByText("HIGH")).toBeInTheDocument();
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
  });

  it("renders the Jira issue key when present", () => {
    const exported: Ticket = {
      ...baseTicket,
      status: "EXPORTED",
      jiraIssueKey: "PROJ-42",
      jiraIssueUrl: "https://example.atlassian.net/browse/PROJ-42",
    };
    render(
      <TicketRow ticket={exported} isSelected={false} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );
    const link = screen.getByText("PROJ-42").closest("a");
    expect(link).toHaveAttribute("href", "https://example.atlassian.net/browse/PROJ-42");
  });

  it("calls onToggle when the checkbox is clicked", async () => {
    const onToggle = vi.fn();
    const u = userEvent.setup();
    render(
      <TicketRow
        ticket={baseTicket}
        isSelected={false}
        onToggle={onToggle}
        onTitleClick={vi.fn()}
      />,
    );
    await u.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith("t-1");
  });

  it("clicking the title calls onTitleClick with the ticket id", async () => {
    const onTitleClick = vi.fn();
    const u = userEvent.setup();
    render(
      <TicketRow
        ticket={baseTicket}
        isSelected={false}
        onToggle={vi.fn()}
        onTitleClick={onTitleClick}
      />,
    );
    await u.click(screen.getByRole("button", { name: "Fix bug" }));
    expect(onTitleClick).toHaveBeenCalledWith("t-1");
  });

  it("clicking the title does NOT toggle selection", async () => {
    const onToggle = vi.fn();
    const u = userEvent.setup();
    render(
      <TicketRow
        ticket={baseTicket}
        isSelected={false}
        onToggle={onToggle}
        onTitleClick={vi.fn()}
      />,
    );
    await u.click(screen.getByRole("button", { name: "Fix bug" }));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("reflects selected state on the checkbox", () => {
    render(
      <TicketRow ticket={baseTicket} isSelected={true} onToggle={vi.fn()} onTitleClick={vi.fn()} />,
    );
    expect(screen.getByRole("checkbox")).toBeChecked();
  });
});
