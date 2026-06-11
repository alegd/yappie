import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatsFooter } from "./stats-footer";

describe("StatsFooter", () => {
  it("renders zeros when audios is empty", () => {
    render(<StatsFooter audios={[]} />);
    expect(screen.getByText(/0 audios/i)).toBeInTheDocument();
    expect(screen.getByText(/0 tickets/i)).toBeInTheDocument();
    expect(screen.getByText(/0 exported/i)).toBeInTheDocument();
  });

  it("computes totals across audios", () => {
    const audios = [
      {
        id: "a-1",
        tickets: [
          { id: "t-1", status: "DRAFT", jiraIssueKey: null },
          { id: "t-2", status: "EXPORTED", jiraIssueKey: "PROJ-1" },
        ],
      },
      {
        id: "a-2",
        tickets: [{ id: "t-3", status: "APPROVED", jiraIssueKey: null }],
      },
    ];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<StatsFooter audios={audios as any} />);
    expect(screen.getByText(/2 audios/i)).toBeInTheDocument();
    expect(screen.getByText(/3 tickets/i)).toBeInTheDocument();
    expect(screen.getByText(/1 exported/i)).toBeInTheDocument();
  });

  it("treats audios without a tickets array as zero", () => {
    const audios = [{ id: "a-1" }];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<StatsFooter audios={audios as any} />);
    expect(screen.getByText(/1 audios/i)).toBeInTheDocument();
    expect(screen.getByText(/0 tickets/i)).toBeInTheDocument();
  });
});
