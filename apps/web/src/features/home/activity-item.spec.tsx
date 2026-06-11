import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActivityItemRow } from "./activity-item";
import type { ActivityItem } from "./types";

vi.mock("next/link", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("ActivityItemRow", () => {
  it("renders audio.uploaded with filename and project name", () => {
    const item: ActivityItem = {
      type: "audio.uploaded",
      audioId: "a-1",
      fileName: "sprint.webm",
      projectId: "p-1",
      projectName: "InstaCaribe",
      at: "2026-06-11T10:00:00.000Z",
    };
    render(<ActivityItemRow item={item} />);
    expect(screen.getByText("sprint.webm")).toBeInTheDocument();
    expect(screen.getByText(/InstaCaribe/)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/dashboard/projects/p-1");
  });

  it("renders audio.completed with ticket count", () => {
    const item: ActivityItem = {
      type: "audio.completed",
      audioId: "a-2",
      fileName: "meeting.webm",
      ticketCount: 4,
      projectId: "p-1",
      projectName: "InstaCaribe",
      at: "2026-06-11T11:00:00.000Z",
    };
    render(<ActivityItemRow item={item} />);
    expect(screen.getByText(/4 tickets/i)).toBeInTheDocument();
    expect(screen.getByText("meeting.webm")).toBeInTheDocument();
  });

  it("renders audio.completed singular for ticketCount=1", () => {
    const item: ActivityItem = {
      type: "audio.completed",
      audioId: "a-3",
      fileName: "single.webm",
      ticketCount: 1,
      projectId: "p-1",
      projectName: "InstaCaribe",
      at: "2026-06-11T11:00:00.000Z",
    };
    render(<ActivityItemRow item={item} />);
    expect(screen.getByText(/1 ticket\b/i)).toBeInTheDocument();
  });

  it("renders ticket.exported with Jira key", () => {
    const item: ActivityItem = {
      type: "ticket.exported",
      ticketId: "t-1",
      ticketTitle: "Fix login",
      jiraIssueKey: "PROJ-42",
      jiraIssueUrl: "https://x.atlassian.net/browse/PROJ-42",
      projectId: "p-1",
      projectName: "InstaCaribe",
      at: "2026-06-11T12:00:00.000Z",
    };
    render(<ActivityItemRow item={item} />);
    expect(screen.getByText("Fix login")).toBeInTheDocument();
    expect(screen.getByText("PROJ-42")).toBeInTheDocument();
  });

  it("falls back gracefully when projectName is null", () => {
    const item: ActivityItem = {
      type: "audio.uploaded",
      audioId: "a-x",
      fileName: "orphan.webm",
      projectId: null,
      projectName: null,
      at: "2026-06-11T10:00:00.000Z",
    };
    render(<ActivityItemRow item={item} />);
    expect(screen.getByText("orphan.webm")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
