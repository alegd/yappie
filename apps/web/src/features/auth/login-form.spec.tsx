import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

const { mockSignIn } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: mockSignIn,
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render login form with email and password fields", () => {
    render(<LoginForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  it("should render submit button with 'Log in' text", () => {
    render(<LoginForm />);

    expect(screen.getByRole("button", { name: "Log in" })).toBeInTheDocument();
  });

  it("should have link to auth page with href '/auth'", () => {
    render(<LoginForm />);

    const link = screen.getByRole("link", { name: "Sign up" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/auth");
  });

  it("should show 'Logging in...' while submitting", async () => {
    const user = userEvent.setup();
    mockSignIn.mockReturnValue(new Promise(() => {})); // never resolves

    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(screen.getByRole("button", { name: "Logging in..." })).toBeInTheDocument();
  });

  it("should call signIn with credentials on form submit", async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue(undefined);

    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(mockSignIn).toHaveBeenCalledWith("credentials", {
      email: "test@example.com",
      password: "secret123",
      redirectTo: "/dashboard/audios",
    });
  });

  it("should show error message when signIn fails", async () => {
    const user = userEvent.setup();
    mockSignIn.mockRejectedValue(new Error("Auth failed"));

    render(<LoginForm />);

    await user.type(screen.getByLabelText("Email"), "bad@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });
  });

  it("should have title 'Log in to Yappie'", () => {
    render(<LoginForm />);

    expect(screen.getByRole("heading", { name: "Log in to Yappie" })).toBeInTheDocument();
  });
});
