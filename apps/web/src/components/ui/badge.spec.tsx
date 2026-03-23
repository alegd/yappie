import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./badge";

describe("Badge", () => {
  it("should render with children", () => {
    render(<Badge>DRAFT</Badge>);
    expect(screen.getByText("DRAFT")).toBeInTheDocument();
  });

  it("should apply default variant styles", () => {
    render(<Badge>LOW</Badge>);
    const badge = screen.getByText("LOW");
    expect(badge.className).toContain("text-zinc-400");
    expect(badge.className).toContain("bg-zinc-400/10");
  });

  it("should apply success variant", () => {
    render(<Badge variant="success">APPROVED</Badge>);
    const badge = screen.getByText("APPROVED");
    expect(badge.className).toContain("text-emerald-400");
  });

  it("should apply danger variant", () => {
    render(<Badge variant="danger">CRITICAL</Badge>);
    const badge = screen.getByText("CRITICAL");
    expect(badge.className).toContain("text-red-400");
  });

  it("should apply info variant", () => {
    render(<Badge variant="info">EXPORTED</Badge>);
    const badge = screen.getByText("EXPORTED");
    expect(badge.className).toContain("text-blue-400");
  });

  it("should apply warning variant", () => {
    render(<Badge variant="warning">MEDIUM</Badge>);
    const badge = screen.getByText("MEDIUM");
    expect(badge.className).toContain("text-yellow-400");
  });

  it("should accept custom className", () => {
    render(<Badge className="w-20 text-center">TEST</Badge>);
    const badge = screen.getByText("TEST");
    expect(badge.className).toContain("w-20");
  });
});
