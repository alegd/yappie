import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "./register-form";

const { mockSignIn } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
}));

const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: mockSignIn,
}));

vi.mock("@/lib/api", () => ({
  api: { post: mockPost, setToken: vi.fn() },
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>
      {children as React.ReactNode}
    </a>
  ),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render form with name, email, and password fields", () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password (min 8 characters)")).toBeInTheDocument();
  });

  it("should render submit button with 'Create account' text", () => {
    render(<RegisterForm />);

    expect(screen.getByRole("button", { name: "Create account" })).toBeInTheDocument();
  });

  it("should have link to login page with href '/login'", () => {
    render(<RegisterForm />);

    const link = screen.getByRole("link", { name: "Log in" });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("should show 'Creating account...' while submitting", async () => {
    const user = userEvent.setup();
    mockPost.mockReturnValue(new Promise(() => {}));

    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Name"), "John Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password (min 8 characters)"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByRole("button", { name: "Creating account..." })).toBeInTheDocument();
  });

  it("should call api.post then signIn on successful registration", async () => {
    const user = userEvent.setup();
    mockPost.mockResolvedValue({ id: "user-1" });
    mockSignIn.mockResolvedValue(undefined);

    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Name"), "John Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password (min 8 characters)"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/auth/register", {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith("credentials", {
        email: "john@example.com",
        password: "password123",
        redirectTo: "/dashboard/audios",
      });
    });
  });

  it("should show error when backend returns error", async () => {
    const user = userEvent.setup();
    mockPost.mockRejectedValue(new Error("Email already in use"));

    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Name"), "John Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password (min 8 characters)"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByText("Email already in use")).toBeInTheDocument();
    });

    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("should show generic error when non-Error is thrown", async () => {
    const user = userEvent.setup();
    mockPost.mockRejectedValue("something went wrong");

    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Name"), "John Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password (min 8 characters)"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(screen.getByText("Registration failed")).toBeInTheDocument();
    });
  });

  it("should have title 'Create your account'", () => {
    render(<RegisterForm />);

    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();
  });
});
