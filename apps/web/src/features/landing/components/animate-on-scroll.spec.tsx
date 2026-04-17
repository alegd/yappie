import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AnimateOnScroll } from "./animate-on-scroll";

describe("AnimateOnScroll", () => {
  it("should render children inside a section", () => {
    render(
      <AnimateOnScroll data-testid="wrapper">
        <p>hello world</p>
      </AnimateOnScroll>,
    );

    expect(screen.getByText("hello world")).toBeInTheDocument();
    expect(screen.getByTestId("wrapper").tagName.toLowerCase()).toBe("section");
  });

  it("should forward id and className to the section element", () => {
    render(
      <AnimateOnScroll id="pricing" className="custom-class" data-testid="wrapper">
        <span>child</span>
      </AnimateOnScroll>,
    );

    const wrapper = screen.getByTestId("wrapper");
    expect(wrapper).toHaveAttribute("id", "pricing");
    expect(wrapper.className).toContain("custom-class");
  });
});
