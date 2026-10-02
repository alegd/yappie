import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatsFooter } from "./stats-footer";

describe("StatsFooter", () => {
  it("renders the counts it is given", () => {
    render(<StatsFooter audioCount={9} ticketCount={7} exportedTicketCount={3} />);
    expect(screen.getByText("9 audios")).toBeInTheDocument();
    expect(screen.getByText("7 tickets")).toBeInTheDocument();
    expect(screen.getByText("3 exported")).toBeInTheDocument();
  });

  it("renders zeros without collapsing them", () => {
    render(<StatsFooter audioCount={0} ticketCount={0} exportedTicketCount={0} />);
    expect(screen.getByText("0 audios")).toBeInTheDocument();
    expect(screen.getByText("0 tickets")).toBeInTheDocument();
    expect(screen.getByText("0 exported")).toBeInTheDocument();
  });
});
