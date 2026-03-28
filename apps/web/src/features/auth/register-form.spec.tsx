import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegisterForm } from "./register-form";

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
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
    mockPush.mockResolvedValue(undefined);
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

  it("should have link to auth page with href '/auth'", () => {
    render(<RegisterForm />);

    const link = screen.getByRole("link", { name: "Log in" });
    expect(link).toHaveAttribute("href", "/auth");
  });

  it("should show 'Creating account...' while submitting", async () => {
    const user = userEvent.setup();
    mockPush.mockReturnValue(new Promise(() => {}));

    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Name"), "John Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password (min 8 characters)"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByRole("button", { name: "Creating account..." })).toBeInTheDocument();
  });

  it("should redirect to /auth on form submit", async () => {
    const user = userEvent.setup();

    render(<RegisterForm />);

    await user.type(screen.getByLabelText("Name"), "John Doe");
    await user.type(screen.getByLabelText("Email"), "john@example.com");
    await user.type(screen.getByLabelText("Password (min 8 characters)"), "password123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/auth");
    });
  });

  it("should have title 'Create your account'", () => {
    render(<RegisterForm />);

    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();
  });
});
