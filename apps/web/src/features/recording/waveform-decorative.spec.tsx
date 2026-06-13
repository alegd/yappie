import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WaveformDecorative } from "./waveform-decorative";

describe("WaveformDecorative", () => {
  it("renders 5 animated bars with staggered animation delays", () => {
    render(<WaveformDecorative />);
    const bars = screen.getAllByTestId("waveform-bar");
    expect(bars).toHaveLength(5);
    expect(bars[0].style.animationDelay).toBe("0ms");
    expect(bars[4].style.animationDelay).toBe("320ms");
  });

  it("has the role of an image labelled for screen readers", () => {
    render(<WaveformDecorative />);
    expect(screen.getByRole("img", { name: /recording waveform/i })).toBeInTheDocument();
  });
});
