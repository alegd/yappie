import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./input";

describe("Input", () => {
  it("should render with label", () => {
    render(<Input id="email" label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("should render without label", () => {
    render(<Input id="email" placeholder="Enter email" />);
    expect(screen.getByPlaceholderText("Enter email")).toBeInTheDocument();
  });

  it("should show error message", () => {
    render(<Input id="email" label="Email" error="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("should apply error border style", () => {
    render(<Input id="email" error="Error" />);
    const input = screen.getByRole("textbox");
    expect(input.className).toContain("border-red-500");
  });

  it("should handle user input", async () => {
    const user = userEvent.setup();
    render(<Input id="name" label="Name" />);

    const input = screen.getByLabelText("Name");
    await user.type(input, "John");
    expect(input).toHaveValue("John");
  });
});
