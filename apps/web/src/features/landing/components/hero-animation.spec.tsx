import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroAnimation } from "./hero-animation";

describe("HeroAnimation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render the container marked aria-hidden (decorative)", () => {
    render(<HeroAnimation />);
    const root = screen.getByTestId("hero-animation");
    expect(root).toHaveAttribute("aria-hidden", "true");
  });

  it("should start in the waveform phase with 'Recording…' label", () => {
    render(<HeroAnimation />);
    expect(screen.getByText(/Recording/)).toBeInTheDocument();
  });

  it("should advance to the transcript phase after 2s", async () => {
    render(<HeroAnimation />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100);
    });
    expect(screen.getByText(/Transcribing|Extracting/)).toBeInTheDocument();
  });

  it("should advance to the tickets phase after 4s", async () => {
    render(<HeroAnimation />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(4100);
    });
    expect(screen.getByText(/Ana \(frontend\)/)).toBeInTheDocument();
    expect(screen.getByText(/Luis \(backend\)/)).toBeInTheDocument();
    expect(screen.getByText(/María \(design\)/)).toBeInTheDocument();
  });

  it("should loop back to the waveform phase after the full cycle", async () => {
    render(<HeroAnimation />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(8100);
    });
    expect(screen.getByText(/Recording/)).toBeInTheDocument();
  });
});
